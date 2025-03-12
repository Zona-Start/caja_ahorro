import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Request } from 'express';
import * as schema from 'src/database/index';
import { envs } from '../config/envs';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      request.user = await this.jwtService.verifyAsync(token, {
        secret: envs.refresh_token_secret,
      });
    } catch {
      const session = await this.drizzle
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions, token));
      if (session.length === 0) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
