import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { Inject } from '@nestjs/common';
import { permissions, rolesPermissions, roles, usersRole } from 'src/database/schema/auth';
import { eq } from 'drizzle-orm';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE_PROVIDER)
    private readonly drizzle: NodePgDatabase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }
    
    // Si el usuario es SUPERADMIN, permitir acceso sin verificar permisos
    if (user.isSuperAdmin) {
      return true;
    }
    
    // Obtener los permisos del usuario a través de sus roles
    const userPermissions = await this.drizzle
      .select({ name: permissions.name })
      .from(permissions)
      .innerJoin(rolesPermissions, eq(rolesPermissions.permissionId, permissions.id))
      .innerJoin(roles, eq(roles.id, rolesPermissions.roleId))
      .innerJoin(usersRole, eq(usersRole.roleId, roles.id))
      .where(eq(usersRole.userId, user.id));
    
    // Verificar si el usuario tiene todos los permisos requeridos
    return requiredPermissions.every(permission => 
      userPermissions.some(userPermission => userPermission.name === permission)
    );
  }
}
