import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { roles, usersRole } from '@/database/schema/tables';
import { Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { envs } from '../config/envs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
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
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: envs.access_token_secret,
      });

      // Asegurarse de que el payload contiene el ID del usuario
      if (!payload.sub && !payload.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub || payload.id;

      // Obtener los roles del usuario desde la base de datos
      const userRoles = await this.drizzle
        .select({ name: roles.name })
        .from(roles)
        .innerJoin(usersRole, eq(usersRole.roleId, roles.id))
        .where(eq(usersRole.userId, userId));

      // Verificar si el usuario tiene el rol SUPERADMIN
      const isSuperAdmin = userRoles.some((role) => role.name === 'superadmin');

      // Adjuntar el usuario a la solicitud con el ID correcto y sus roles
      request.user = {
        id: userId,
        username: payload.username,
        email: payload.email,
        roles: userRoles.map((role) => role.name),
        isSuperAdmin, // Añadir flag para indicar si es SUPERADMIN
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Access Token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
