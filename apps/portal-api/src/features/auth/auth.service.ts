import { Env as AppEnv } from '@/common/config/envs';
import { canAssociateAccessPortal } from '@/common/constants/associate-access';
import { PortalMemberContext } from '@/common/decorators/current-member.decorator';
import { SecurityService } from '@/common/security/security.service';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import {
  associates,
  portalAccessLog,
  portalAccounts,
  portalSessions,
  tenants,
} from '@/database/schema';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { OtpService } from '../otp/otp.service';
import {
  PORTAL_AUDIENCE,
  PORTAL_ISSUER,
} from './strategies/portal-jwt.strategy';

export const PORTAL_REFRESH_COOKIE = 'portal_session';

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

interface LoginPayload {
  identifier: string;
  password: string;
  tenantId?: string;
}

function parseDurationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const factor: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (factor[unit] ?? 86_400_000);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;
  private readonly refreshExpiresAtMs: number;
  private readonly maxLoginAttempts: number;
  private readonly lockMinutes: number;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly security: SecurityService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly otp: OtpService,
  ) {
    this.accessSecret = this.requireSecret('PORTAL_JWT_SECRET');
    this.refreshSecret = this.requireSecret('PORTAL_JWT_REFRESH_SECRET');
    this.accessExpiry = this.config.get('PORTAL_JWT_EXPIRY', { infer: true });
    this.refreshExpiry = this.config.get('PORTAL_JWT_REFRESH_EXPIRY', {
      infer: true,
    });
    this.refreshExpiresAtMs = parseDurationToMs(this.refreshExpiry);
    this.maxLoginAttempts = this.config.get('PORTAL_MAX_LOGIN_ATTEMPTS', {
      infer: true,
    });
    this.lockMinutes = this.config.get('PORTAL_LOCK_MINUTES', { infer: true });
  }

  private requireSecret(
    key: 'PORTAL_JWT_SECRET' | 'PORTAL_JWT_REFRESH_SECRET',
  ) {
    const value = process.env[key];
    if (!value) throw new Error(`${key} es requerido (fail-closed)`);
    return value;
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async login(payload: LoginPayload, context: LoginContext = {}) {
    const identifier = payload.identifier.trim();

    const conditions = [
      eq(portalAccounts.username, identifier),
      isNull(portalAccounts.deletedAt),
    ];
    if (payload.tenantId) {
      conditions.push(eq(portalAccounts.tenantId, payload.tenantId));
    }

    const account = await this.db.query.portalAccounts.findFirst({
      where: and(...conditions),
    });

    if (!account) {
      await this.logAccess(null, null, 'LOGIN_FAILED', context, {
        identifier,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
      await this.logAccess(
        account.id,
        account.tenantId,
        'LOGIN_FAILED',
        context,
        {
          reason: 'locked',
        },
      );
      throw new HttpException(
        'Cuenta bloqueada temporalmente. Intente más tarde.',
        423,
      );
    }

    if (account.status === 'DISABLED') {
      await this.logAccess(
        account.id,
        account.tenantId,
        'LOGIN_FAILED',
        context,
        {
          reason: 'disabled',
        },
      );
      throw new UnauthorizedException('Cuenta no habilitada');
    }

    const passwordOk = await this.security.comparePassword(
      payload.password,
      account.passwordHash,
    );

    if (!passwordOk) {
      await this.registerFailedAttempt(
        account.id,
        account.failedAttempts,
        account.tenantId,
        context,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Solo asociados con estatus ACTIVE o PENDING pueden acceder al portal.
    const loginAssociate = await this.db.query.associates.findFirst({
      where: eq(associates.id, account.associateId),
      columns: { status: true },
    });
    if (!canAssociateAccessPortal(loginAssociate?.status)) {
      await this.logAccess(
        account.id,
        account.tenantId,
        'LOGIN_FAILED',
        context,
        {
          reason: 'associate_status',
          status: loginAssociate?.status ?? null,
        },
      );
      throw new UnauthorizedException(
        'Tu estatus de asociado no permite el acceso al Portal',
      );
    }

    await this.db
      .update(portalAccounts)
      .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(portalAccounts.id, account.id));

    const { accessToken, refreshToken } = await this.issueSession(
      account,
      context,
    );

    await this.logAccess(account.id, account.tenantId, 'LOGIN', context);

    return {
      accessToken,
      refreshToken,
      user: await this.buildUser(account),
    };
  }

  // ── Refresh (rotación de sesión) ─────────────────────────────────────────
  async refreshTokens(refreshToken: string, context: LoginContext = {}) {
    let payload: { sub: string; sid: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.refreshSecret,
        audience: PORTAL_AUDIENCE,
        issuer: PORTAL_ISSUER,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const session = await this.db.query.portalSessions.findFirst({
      where: and(
        eq(portalSessions.id, payload.sid),
        eq(portalSessions.accountId, payload.sub),
        eq(portalSessions.isActive, true),
      ),
    });

    if (!session) {
      throw new UnauthorizedException('Sesión inválida o revocada');
    }

    // Detección de reuso: el token debe coincidir con el hash de la sesión.
    if (
      !this.security.safeEqual(
        this.security.hashToken(refreshToken),
        session.refreshTokenHash,
      )
    ) {
      await this.revokeAllSessions(payload.sub);
      throw new UnauthorizedException('Sesión inválida o revocada');
    }

    const account = await this.db.query.portalAccounts.findFirst({
      where: and(
        eq(portalAccounts.id, payload.sub),
        isNull(portalAccounts.deletedAt),
      ),
    });

    if (
      !account ||
      account.status === 'DISABLED' ||
      account.status === 'LOCKED'
    ) {
      throw new UnauthorizedException('Cuenta no válida o inactiva');
    }

    // Solo asociados con estatus ACTIVE o PENDING pueden refrescar la sesión.
    const refreshAssociate = await this.db.query.associates.findFirst({
      where: eq(associates.id, account.associateId),
      columns: { status: true },
    });
    if (!canAssociateAccessPortal(refreshAssociate?.status)) {
      throw new UnauthorizedException(
        'Tu estatus de asociado no permite el acceso al Portal',
      );
    }

    await this.db
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'rotation',
      })
      .where(eq(portalSessions.id, session.id));

    const tokens = await this.issueSession(account, context);

    return { ...tokens, user: await this.buildUser(account) };
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async logout(accountId: string, sid?: string) {
    if (sid) {
      await this.db
        .update(portalSessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'logout',
        })
        .where(
          and(
            eq(portalSessions.id, sid),
            eq(portalSessions.accountId, accountId),
          ),
        );
    } else {
      await this.revokeAllSessions(accountId);
    }
  }

  async revokeAllSessions(accountId: string) {
    await this.db
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'revoked',
      })
      .where(
        and(
          eq(portalSessions.accountId, accountId),
          eq(portalSessions.isActive, true),
        ),
      );
  }

  // ── Cambio de contraseña (opcional) ──────────────────────────────────────
  async changePassword(
    member: PortalMemberContext,
    input: { currentPassword: string; newPassword: string },
  ) {
    const account = await this.db.query.portalAccounts.findFirst({
      where: eq(portalAccounts.id, member.accountId),
    });

    if (!account) throw new UnauthorizedException('Cuenta no encontrada');

    const currentOk = await this.security.comparePassword(
      input.currentPassword,
      account.passwordHash,
    );
    if (!currentOk) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    if (input.newPassword === account.username) {
      throw new HttpException(
        'La nueva contraseña no puede ser igual a la cédula',
        400,
      );
    }

    const passwordHash = await this.security.hashPassword(input.newPassword);

    await this.db
      .update(portalAccounts)
      .set({ passwordHash, passwordChangedAt: new Date() })
      .where(eq(portalAccounts.id, account.id));

    // Revocar todas las demás sesiones (conservando la actual).
    await this.db
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'password_change',
      })
      .where(
        and(
          eq(portalSessions.accountId, account.id),
          ne(portalSessions.id, member.sid),
        ),
      );

    await this.logAccess(account.id, account.tenantId, 'PASSWORD_CHANGE', {});

    return { changed: true };
  }

  // ── Recuperación de contraseña (OTP por correo) ──────────────────────────
  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const account = await this.db.query.portalAccounts.findFirst({
      where: and(
        eq(portalAccounts.username, identifier.trim()),
        isNull(portalAccounts.deletedAt),
      ),
    });

    if (account?.email) {
      try {
        await this.otp.requestEmailCode({
          accountId: account.id,
          purpose: 'RESET',
          destination: account.email,
        });
      } catch (error) {
        this.logger.warn(`No se pudo enviar OTP de reseteo: ${String(error)}`);
      }
    }

    // Respuesta genérica (anti-enumeración).
    return {
      message: 'Si la cuenta existe, recibirás un correo con instrucciones.',
    };
  }

  async resetPassword(input: {
    identifier: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const account = await this.db.query.portalAccounts.findFirst({
      where: and(
        eq(portalAccounts.username, input.identifier.trim()),
        isNull(portalAccounts.deletedAt),
      ),
    });

    // Error genérico para no revelar si la cuenta existe.
    if (!account) {
      throw new BadRequestException('Código inválido o expirado');
    }

    await this.otp.verifyCode({
      accountId: account.id,
      purpose: 'RESET',
      code: input.code,
    });

    if (input.newPassword === account.username) {
      throw new BadRequestException(
        'La contraseña no puede ser igual a la cédula',
      );
    }

    const passwordHash = await this.security.hashPassword(input.newPassword);

    await this.db
      .update(portalAccounts)
      .set({
        passwordHash,
        passwordChangedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(portalAccounts.id, account.id));

    await this.revokeAllSessions(account.id);

    return { message: 'Contraseña restablecida' };
  }

  // ── Internos ─────────────────────────────────────────────────────────────
  private async issueSession(
    account: typeof portalAccounts.$inferSelect,
    context: LoginContext,
  ) {
    const sessionId = randomUUID();
    const { accessToken, refreshToken } = this.signTokens(account, sessionId);

    await this.db.insert(portalSessions).values({
      id: sessionId,
      accountId: account.id,
      refreshTokenHash: this.security.hashToken(refreshToken),
      refreshTokenExpiresAt: new Date(Date.now() + this.refreshExpiresAtMs),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      correlationId: sessionId,
    });

    return { accessToken, refreshToken };
  }

  private signTokens(
    account: typeof portalAccounts.$inferSelect,
    sessionId: string,
  ) {
    const payload = {
      sub: account.id,
      associateId: account.associateId,
      tenantId: account.tenantId,
      username: account.username,
      sid: sessionId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiry as unknown as number,
      audience: PORTAL_AUDIENCE,
      issuer: PORTAL_ISSUER,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiry as unknown as number,
      audience: PORTAL_AUDIENCE,
      issuer: PORTAL_ISSUER,
    });

    return { accessToken, refreshToken };
  }

  private async registerFailedAttempt(
    accountId: string,
    currentAttempts: number,
    tenantId: string,
    context: LoginContext,
  ) {
    const attempts = currentAttempts + 1;
    const locked = attempts >= this.maxLoginAttempts;

    await this.db
      .update(portalAccounts)
      .set({
        failedAttempts: attempts,
        lockedUntil: locked
          ? new Date(Date.now() + this.lockMinutes * 60_000)
          : null,
      })
      .where(eq(portalAccounts.id, accountId));

    await this.logAccess(accountId, tenantId, 'LOGIN_FAILED', context, {
      attempts,
      locked,
    });
  }

  private async buildUser(account: typeof portalAccounts.$inferSelect) {
    const [associate, tenant] = await Promise.all([
      this.db.query.associates.findFirst({
        where: eq(associates.id, account.associateId),
      }),
      this.db.query.tenants.findFirst({
        where: eq(tenants.id, account.tenantId),
      }),
    ]);

    return {
      accountId: account.id,
      cedula: account.username,
      fullname: associate?.fullname ?? account.username,
      mustChangePassword: account.mustChangePassword,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug ?? null,
            logoUrl: tenant.logoUrl ?? null,
            primaryColor: tenant.primaryColor ?? null,
          }
        : null,
    };
  }

  private async logAccess(
    accountId: string | null,
    tenantId: string | null,
    event:
      | 'LOGIN'
      | 'LOGIN_FAILED'
      | 'LOGOUT'
      | 'READ'
      | 'PROFILE_UPDATE'
      | 'PASSWORD_CHANGE'
      | 'OTP_SENT',
    context: LoginContext,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await this.db.insert(portalAccessLog).values({
        accountId,
        tenantId,
        event,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: metadata ?? null,
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar access_log: ${String(error)}`);
    }
  }
}
