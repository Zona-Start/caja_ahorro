// src/common/guards/tenant.guard.ts
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import {
  permissions,
  rolePermissions,
  roles,
  tenantMembers,
  userPermissions,
} from '@/database/schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Public bypass
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // JwtAuthGuard handles this

    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;

    // 2. SystemAdmin: acceso total, impersonación opcional
    if (user.isSystemAdmin) {
      request.userRole = 'superadmin';
      request.userPermissions = ['*:*:all'];
      if (headerTenantId) {
        request.tenantId = headerTenantId;
      }
      return true;
    }

    // 3. Usuario normal: x-tenant-id obligatorio
    if (!headerTenantId) {
      throw new ForbiddenException(
        'Se requiere el header x-tenant-id para acceder a este recurso',
      );
    }

    // 4. Validar membresía activa en tenant_members
    const membership = await this.db
      .select({
        roleId: tenantMembers.roleId,
        roleName: roles.name,
      })
      .from(tenantMembers)
      .innerJoin(roles, eq(roles.id, tenantMembers.roleId))
      .where(
        and(
          eq(tenantMembers.userId, user.sub),
          eq(tenantMembers.tenantId, headerTenantId),
          eq(tenantMembers.isActive, true),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      throw new ForbiddenException('No tienes acceso a esta organización');
    }

    const { roleId, roleName } = membership[0];
    request.tenantId = headerTenantId;
    request.userRole = roleName;

    // 5. Bypass de permisos si es superadmin dentro del tenant
    if (roleName === 'superadmin') {
      request.userPermissions = ['*:*:all'];
      return true;
    }

    // 6. Cargar permisos del rol + permisos especiales del usuario en este tenant
    const [rolePerms, userPerms] = await Promise.all([
      // Permisos del rol
      this.db
        .select({
          resource: permissions.resource,
          action: permissions.action,
          scope: permissions.scope,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(permissions.id, rolePermissions.permissionId),
        )
        .where(eq(rolePermissions.roleId, roleId)),

      // Permisos especiales del usuario en este tenant
      this.db
        .select({
          resource: permissions.resource,
          action: permissions.action,
          scope: permissions.scope,
        })
        .from(userPermissions)
        .innerJoin(
          permissions,
          eq(permissions.id, userPermissions.permissionId),
        )
        .where(
          and(
            eq(userPermissions.userId, user.sub),
            eq(userPermissions.tenantId, headerTenantId),
          ),
        ),
    ]);

    // 7. Unificar sin duplicados
    const permSet = new Set<string>();
    for (const p of [...rolePerms, ...userPerms]) {
      permSet.add(`${p.resource}:${p.action}:${p.scope}`);
    }

    request.userPermissions = Array.from(permSet);
    return true;
  }
}
