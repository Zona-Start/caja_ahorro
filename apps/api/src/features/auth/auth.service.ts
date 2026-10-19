import { durationToMs } from '@/common/utils';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  AUTH_METHODS,
  FAILURE_REASONS,
  loginAttempts,
  sessions,
  tenantModules,
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
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import { and, eq, gt, inArray } from 'drizzle-orm';
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
const DEFAULT_ACCESS_EXPIRY = '2h';
const DEFAULT_REFRESH_EXPIRY = '7d';
const DEFAULT_REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_GRACE_MS = 15000;

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
    const { ipAddress, userAgent } = context;

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

    const sessionId = randomUUID();
    const [accessToken, refreshToken] = this.generateTokens(
      user,
      sessionId,
      tenantId,
    );

    const tokenHash = await this.cryptographyService.hashData(refreshToken);

    await this.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash,
      context,
    });

    await this.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: await this.formatAuthUser(user, tenantId),
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
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub as string;
    const sessionId = payload.sid as string | undefined;

    if (!userId || !sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    const matchesCurrent = await this.cryptographyService.verifyToken(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!matchesCurrent) {
      const matchesPrevious = session.previousRefreshTokenHash
        ? await this.cryptographyService.verifyToken(
            refreshToken,
            session.previousRefreshTokenHash,
          )
        : false;

      const withinGracePeriod =
        !!session.lastRotatedAt &&
        Date.now() - new Date(session.lastRotatedAt).getTime() <=
          this.refreshGraceMs;

      if (!(matchesPrevious && withinGracePeriod)) {
        await this.revokeAllSessions(userId);
        this.logger.warn(
          `Refresh token reuse detected for user ${userId}; all sessions revoked`,
        );
        throw new UnauthorizedException('Refresh token invalid or revoked');
      }
    }

    if (!session.isActive || session.revokedAt) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    if (new Date(session.refreshTokenExpiresAt).getTime() <= Date.now()) {
      await this.db
        .update(sessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'expired',
        })
        .where(eq(sessions.id, session.id));
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.checkSessionAnomalies(session, context);

    const user = (await this.usersService.findById(
      userId,
    )) as UserWithRelations | null;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'active') {
      await this.revokeAllSessions(userId);
      throw new UnauthorizedException('User account is not active');
    }

    const tenantId = payload.tid as string | undefined;
    const [accessToken, newRefreshToken] = this.generateTokens(
      user,
      session.id,
      tenantId,
    );

    const newTokenHash =
      await this.cryptographyService.hashData(newRefreshToken);

    await this.rotateSession(session, newTokenHash);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: await this.formatAuthUser(user, tenantId),
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

  private get accessTokenExpiry(): string {
    return process.env.JWT_EXPIRY || DEFAULT_ACCESS_EXPIRY;
  }

  private get refreshTokenExpiry(): string {
    return process.env.JWT_REFRESH_EXPIRY || DEFAULT_REFRESH_EXPIRY;
  }

  private get refreshTokenExpiryMs(): number {
    return durationToMs(this.refreshTokenExpiry, DEFAULT_REFRESH_EXPIRY_MS);
  }

  private get refreshGraceMs(): number {
    const configured = Number(process.env.REFRESH_TOKEN_GRACE_PERIOD_MS);
    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_REFRESH_GRACE_MS;
  }

  generateTokens(
    user: UserWithRelations,
    sessionId: string,
    tenantId?: string,
  ): [string, string] {
    const payload = {
      sub: user.id,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin || false,
      sid: sessionId,
      ...(tenantId ? { tid: tenantId } : {}),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: this.accessTokenExpiry as JwtSignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: this.refreshTokenExpiry as JwtSignOptions['expiresIn'],
    });

    return [accessToken, refreshToken];
  }

  private async createSession(params: {
    id: string;
    userId: string;
    tokenHash: string;
    context: LoginContext;
  }) {
    const { id, userId, tokenHash, context } = params;

    await this.db.insert(sessions).values({
      id,
      userId,
      refreshToken: '',
      refreshTokenHash: tokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + this.refreshTokenExpiryMs),
      rotationCount: 0,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      authMethod: AUTH_METHODS.PASSWORD,
      correlationId: randomUUID(),
    });
  }

  private async rotateSession(session: any, newTokenHash: string) {
    await this.db
      .update(sessions)
      .set({
        refreshToken: '',
        refreshTokenHash: newTokenHash,
        refreshTokenExpiresAt: new Date(Date.now() + this.refreshTokenExpiryMs),
        previousRefreshTokenHash: session.refreshTokenHash,
        lastRotatedAt: new Date(),
        rotationCount: (session.rotationCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));
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

  private async formatAuthUser(
    user: UserWithRelations,
    requestedTenantId?: string,
  ) {
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

    const modulesByTenant = await this.getActiveModulesByTenant(
      memberships.map((m) => m.tenantId).filter(Boolean),
    );

    const membershipsWithModules = memberships.map((m) => ({
      ...m,
      modules: modulesByTenant.get(m.tenantId) ?? [],
    }));

    const activeMembership = membershipsWithModules[0];

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
          modules: activeMembership.modules,
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
      memberships: membershipsWithModules,
      permissions: consolidatedPermissions,
    };
  }

  private async getActiveModulesByTenant(
    tenantIds: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (tenantIds.length === 0) return map;

    const rows = await this.db
      .select({
        tenantId: tenantModules.tenantId,
        moduleCode: tenantModules.moduleCode,
      })
      .from(tenantModules)
      .where(
        and(
          inArray(tenantModules.tenantId, tenantIds),
          eq(tenantModules.status as any, 'ENABLED'),
        ),
      );

    for (const row of rows) {
      const list = map.get(row.tenantId) ?? [];
      list.push(row.moduleCode);
      map.set(row.tenantId, list);
    }

    return map;
  }
}
