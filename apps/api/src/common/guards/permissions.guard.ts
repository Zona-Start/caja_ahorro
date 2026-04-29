// src/common/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  type PermissionInput,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  // ✅ MAPA DE JERARQUÍA: Mayor número = Mayor acceso
  private readonly scopeHierarchy: Record<string, number> = {
    own: 1,
    team: 2,
    department: 3,
    branch: 4,
    tenant: 5,
    all: 6,
    global: 7,
  };

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Si es público, saltar validación
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Obtener permisos requeridos
    const requiredPermissionsInput = this.reflector.getAllAndOverride<
      PermissionInput[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissionsInput || requiredPermissionsInput.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException(
        'Autenticación requerida para verificar permisos',
      );
    }

    // Leer del contexto inyectado por TenantGuard
    const userRoleName: string | undefined = request.userRole;
    if (userRoleName === 'superadmin') {
      return true;
    }

    let userPermissions: string[] = [];
    if (Array.isArray(request.userPermissions)) {
      userPermissions = request.userPermissions;
    }

    if (userPermissions.length === 0) {
      throw new ForbiddenException('El usuario no tiene permisos asignados');
    }

    // ✅ LÓGICA 'AND': El usuario debe cumplir TODOS los permisos exigidos por el endpoint
    const hasPermission = requiredPermissionsInput.every((perm) => {
      const required =
        typeof perm === 'string'
          ? perm
          : `${perm.resource}:${perm.action}:${perm.scope || 'own'}`;
      return this.userHasPermission(userPermissions, required);
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Permisos insuficientes para realizar esta acción',
      );
    }

    return true;
  }

  private userHasPermission(
    userPermissions: string[],
    required: string,
  ): boolean {
    const [reqResource, reqAction, reqScope = 'own'] = required.split(':');
    const reqScopeWeight = this.scopeHierarchy[reqScope] || 0;

    return userPermissions.some((userPerm) => {
      const parts = userPerm.split(':');
      const upResource = parts[0];
      const upAction = parts[1] || '*';
      const upScope = parts[2] || 'own';
      const userScopeWeight = this.scopeHierarchy[upScope] || 0;

      const resourceMatch = upResource === reqResource || upResource === '*';
      const actionMatch = upAction === reqAction || upAction === '*';

      // ✅ LÓGICA SCOPE: El permiso del usuario debe ser de un scope MAYOR o IGUAL al requerido
      const scopeMatch = userScopeWeight >= reqScopeWeight || upScope === 'all';

      return resourceMatch && actionMatch && scopeMatch;
    });
  }
}
