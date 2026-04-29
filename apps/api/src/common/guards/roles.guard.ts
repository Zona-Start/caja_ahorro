// src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Si la ruta es pública, ignoramos la validación de roles
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Obtener roles requeridos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // 🚨 SEGURIDAD: Si requiere rol y no hay usuario, denegar acceso
    if (!user) {
      throw new UnauthorizedException(
        'Autenticación requerida para verificar roles',
      );
    }

    // Leer del contexto inyectado por TenantGuard
    const userRoleName: string | undefined = request.userRole;

    if (userRoleName === 'superadmin') {
      return true;
    }

    if (!userRoleName) {
      throw new ForbiddenException('El usuario no tiene un rol asignado');
    }

    const hasRole = requiredRoles.includes(userRoleName);
    if (!hasRole) {
      throw new ForbiddenException(
        'Permisos insuficientes: requiere un rol superior',
      );
    }

    return true;
  }
}
