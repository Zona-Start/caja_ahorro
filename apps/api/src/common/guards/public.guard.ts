import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PublicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no está marcado como público, permitir que otros guards (JWT, Roles, Permissions) se ejecuten
    if (!isPublic) {
      return true;
    }

    // Si está marcado como público, permitir acceso
    return true;
  }
}
