import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Contexto del asociado autenticado, derivado SIEMPRE del token. */
export interface PortalMemberContext {
  accountId: string;
  associateId: string;
  tenantId: string;
  username: string;
  /** Id de la sesión actual (para revocar selectivamente). */
  sid: string;
}

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PortalMemberContext =>
    ctx.switchToHttp().getRequest().user,
);
