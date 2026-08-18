import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  AUTH_METHODS,
  FAILURE_REASONS,
  loginAttempts,
  sessions,
  users,
} from '@/database/schema';
import { SystemEventHelper } from '@/features/audit/audit-event.service';
import { LoginInput } from '@/features/auth/dto/login.dto';
import { CryptographyService } from '@/features/core/security/cryptography.service';
import { SecurityService } from '@/features/core/security/security.service';
import { UsersService } from '@/features/core/users/users.service';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

interface UserWithRelations {
  id: string;
  username: string;
  email: string;
  fullname: string;
  status: string;
  isSystemAdmin: boolean;
  passwordHash: string;
  tenantMembers?: any[];
  userPermissions?: any[];
}

interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

const MAX_CONCURRENT_SESSIONS = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly cryptographyService: CryptographyService,
    private readonly jwtService: JwtService,
    private readonly systemEventHelper: SystemEventHelper,
  ) {}

  async login(loginDto: LoginInput, context: LoginContext = {}): Promise<any> {
    const { identifier, password, tenantId } = loginDto;
    const { ipAddress, userAgent, deviceFingerprint } = context;

    const user = (await this.usersService.findByIdentifier(
      identifier.trim(),
    )) as UserWithRelations | null;

    if (!user) {
      await this.logLoginAttempt(
        null,
        identifier,
        false,
        FAILURE_REASONS.USER_NOT_FOUND,
        context,
      );
      await this.systemEventHelper.logAuthenticationFailed(
        identifier,
        FAILURE_REASONS.USER_NOT_FOUND,
        { ipAddress, userAgent },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (tenantId) {
      const hasMembership = (user.tenantMembers || []).some(
        (m) => m.tenantId === tenantId && m.isActive !== false,
      );
      if (!hasMembership) {
        await this.logLoginAttempt(
          user.id,
          identifier,
          false,
          FAILURE_REASONS.INVALID_CREDENTIALS,
          context,
        );
        await this.systemEventHelper.logAuthenticationFailed(
          identifier,
          FAILURE_REASONS.INVALID_CREDENTIALS,
          { ipAddress, userAgent },
        );
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const isValidPassword = await this.securityService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      await this.logLoginAttempt(
        user.id,
        identifier,
        false,
        FAILURE_REASONS.INVALID_CREDENTIALS,
        context,
      );
      await this.systemEventHelper.logAuthenticationFailed(
        identifier,
        FAILURE_REASONS.INVALID_CREDENTIALS,
        { ipAddress, userAgent },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      await this.logLoginAttempt(
        user.id,
        identifier,
        false,
        FAILURE_REASONS.USER_INACTIVE,
        context,
      );
      await this.systemEventHelper.logAuthenticationFailed(
        identifier,
        FAILURE_REASONS.USER_INACTIVE,
        { ipAddress, userAgent },
      );
      throw new UnauthorizedException('User account is not active');
    }

    const rateLimitExceeded = await this.checkRateLimit(user.id);
    if (rateLimitExceeded) {
      await this.logLoginAttempt(
        user.id,
        identifier,
        false,
        FAILURE_REASONS.RATE_LIMIT_EXCEEDED,
        context,
      );
      await this.systemEventHelper.logAuthenticationFailed(
        identifier,
        FAILURE_REASONS.RATE_LIMIT_EXCEEDED,
        { ipAddress, userAgent },
      );
      throw new UnauthorizedException(
        'Too many login attempts. Please try again later.',
      );
    }

    await this.logLoginAttempt(user.id, identifier, true, undefined, context);

    await this.revokeOldSessionsIfNeeded(user.id);

    const [accessToken, refreshToken] = await this.generateTokens(user);

    const tokenHash = await this.cryptographyService.hashData(refreshToken);

    await this.createSession(user.id, refreshToken, tokenHash, context);

    await this.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.formatAuthUser(user, tenantId),
    };
  }

  async refreshTokens(
    refreshToken: string,
    context: LoginContext = {},
  ): Promise<any> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;

    const session = await this.db.query.sessions.findFirst({
      where: and(eq(sessions.userId, userId), eq(sessions.isActive, true)),
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    await this.checkSessionAnomalies(session, context);

    await this.rotateSession(session);

    const user = (await this.usersService.findById(
      userId,
    )) as UserWithRelations | null;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [accessToken, newRefreshToken] = await this.generateTokens(user);

    const newTokenHash =
      await this.cryptographyService.hashData(newRefreshToken);

    await this.createSession(user.id, newRefreshToken, newTokenHash, context);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.formatAuthUser(user),
    };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.db
        .update(sessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'logout',
        })
        .where(eq(sessions.id, sessionId));
    } else {
      await this.db
        .update(sessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'logout',
        })
        .where(eq(sessions.userId, userId));
    }
  }

  async revokeAllSessions(userId: string) {
    await this.db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'revoked_by_user',
      })
      .where(eq(sessions.userId, userId));
  }

  async generateTokens(user: UserWithRelations): Promise<[string, string]> {
    const payload = {
      sub: user.id,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin || false,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return [accessToken, refreshToken];
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    tokenHash: string,
    context: LoginContext,
  ) {
    const previousSession = await this.db.query.sessions.findFirst({
      where: and(eq(sessions.userId, userId), eq(sessions.isActive, true)),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const [session] = await this.db
      .insert(sessions)
      .values({
        userId,
        refreshToken,
        refreshTokenHash: tokenHash,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        previousRefreshTokenHash: previousSession?.refreshTokenHash,
        lastRotatedAt: previousSession?.lastRotatedAt,
        rotationCount: sql`(${previousSession?.rotationCount || 0}) + 1`,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        authMethod: AUTH_METHODS.PASSWORD,
        correlationId: randomBytes(16).toString('hex'),
      })
      .returning();

    return session;
  }

  private async rotateSession(previousSession: any) {
    await this.db
      .update(sessions)
      .set({
        refreshToken: '',
        previousRefreshTokenHash: previousSession.refreshTokenHash,
        lastRotatedAt: new Date(),
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'rotation',
      })
      .where(eq(sessions.id, previousSession.id));
  }

  private async revokeOldSessionsIfNeeded(userId: string) {
    const activeSessions = await this.db.query.sessions.findMany({
      where: and(eq(sessions.userId, userId), eq(sessions.isActive, true)),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      limit: MAX_CONCURRENT_SESSIONS + 1,
    });

    if (activeSessions.length > MAX_CONCURRENT_SESSIONS) {
      const toRevoke = activeSessions.slice(MAX_CONCURRENT_SESSIONS);
      for (const session of toRevoke) {
        await this.db
          .update(sessions)
          .set({
            isActive: false,
            revokedAt: new Date(),
            revokedReason: 'max_sessions_exceeded',
          })
          .where(eq(sessions.id, session.id));
      }
    }
  }

  private async checkSessionAnomalies(session: any, context: LoginContext) {
    if (context.ipAddress && session.ipAddress !== context.ipAddress) {
      this.logger.warn(
        `Session anomaly detected: IP changed from ${session.ipAddress} to ${context.ipAddress} for user ${session.userId}`,
      );
    }

    if (
      context.deviceFingerprint &&
      session.deviceFingerprint !== context.deviceFingerprint
    ) {
      this.logger.warn(
        `Session anomaly detected: device changed for user ${session.userId}`,
      );
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const recentFailedAttempts = await this.db.query.loginAttempts.findMany({
      where: and(
        eq(loginAttempts.userId, userId),
        eq(loginAttempts.success, false),
        gt(loginAttempts.createdAt, windowStart),
      ),
    });

    return recentFailedAttempts.length >= MAX_LOGIN_ATTEMPTS;
  }

  private async logLoginAttempt(
    userId: string | null,
    username: string,
    success: boolean,
    failureReason: string | undefined,
    context: LoginContext,
  ) {
    await this.db.insert(loginAttempts).values({
      userId,
      username: username.slice(0, 50),
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      success,
      failureReason,
      correlationId: randomBytes(16).toString('hex'),
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  private formatAuthUser(user: UserWithRelations, requestedTenantId?: string) {
    const memberships = (user.tenantMembers || []).map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenant?.name,
      bussinessType: m.tenant?.businessType,
      slug: m.tenant?.slug ?? null,
      logoUrl: m.tenant?.logoUrl ?? null,
      primaryColor: m.tenant?.primaryColor ?? null,
      role: {
        id: m.role?.id,
        name: m.role?.name,
      },
      permissions: (m.role?.rolePermissions || []).map((rp: any) => ({
        resource: rp.permission?.resource,
        action: rp.permission?.action,
        scope: rp.permission?.scope,
      })),
    }));

    if (requestedTenantId) {
      const index = memberships.findIndex(
        (m) => m.tenantId === requestedTenantId,
      );
      if (index > 0) {
        const [target] = memberships.splice(index, 1);
        memberships.unshift(target);
      }
    }

    const activeMembership = memberships[0];

    const specialPermissions = (user.userPermissions || [])
      .filter(
        (up) => !activeMembership || up.tenantId === activeMembership.tenantId,
      )
      .map((up) => ({
        resource: up.permission?.resource,
        action: up.permission?.action,
        scope: up.permission?.scope,
      }));

    const consolidatedPermissions = activeMembership
      ? [...activeMembership.permissions, ...specialPermissions]
      : specialPermissions;

    const activeTenant = activeMembership
      ? {
          id: activeMembership.tenantId,
          name: activeMembership.tenantName,
          slug: activeMembership.slug,
          logoUrl: activeMembership.logoUrl,
          primaryColor: activeMembership.primaryColor,
        }
      : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      status: user.status,
      isSystemAdmin: user.isSystemAdmin || false,
      activeTenantId: activeMembership?.tenantId || null,
      activeTenant,
      memberships,
      permissions: consolidatedPermissions,
    };
  }
}
