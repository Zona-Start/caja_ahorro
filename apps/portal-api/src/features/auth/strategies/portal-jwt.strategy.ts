import type { PortalMemberContext } from '@/common/decorators/current-member.decorator';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { portalAccounts } from '@/database/schema';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { and, eq, isNull } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';

export const PORTAL_AUDIENCE = 'zonastart-portal';
export const PORTAL_ISSUER = 'zonastart-portal';

export interface PortalJwtPayload {
  sub: string; // accountId
  associateId: string;
  tenantId: string;
  username: string;
  sid: string;
}

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(
  Strategy,
  'portal-jwt',
) {
  private readonly db: DrizzleDatabase;

  constructor(@Inject(DRIZZLE_PROVIDER) db: DrizzleDatabase) {
    // Fail-closed: sin secreto no se levanta el servicio.
    const secret = process.env.PORTAL_JWT_SECRET;
    if (!secret) {
      throw new Error('PORTAL_JWT_SECRET es requerido (fail-closed)');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: PORTAL_AUDIENCE,
      issuer: PORTAL_ISSUER,
    });

    this.db = db;
  }

  async validate(payload: PortalJwtPayload): Promise<PortalMemberContext> {
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

    return {
      accountId: account.id,
      associateId: account.associateId,
      tenantId: account.tenantId,
      username: account.username,
      sid: payload.sid,
    };
  }
}
