import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../core/users/users.service';

export interface JwtPayload {
  sub: string;
  userId: string;
  username: string;
  isSystemAdmin: boolean;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return {
      sub: user.id,
      userId: user.id,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin ?? false,
    };
  }
}
