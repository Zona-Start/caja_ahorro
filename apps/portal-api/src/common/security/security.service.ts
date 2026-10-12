import { Env } from '@/common/config/envs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

@Injectable()
export class SecurityService {
  private readonly saltRounds: number;
  private readonly tokenPepper: string;

  constructor(config: ConfigService<Env, true>) {
    this.saltRounds = config.get('PORTAL_BCRYPT_SALT_ROUNDS', { infer: true });
    this.tokenPepper = config.get('PORTAL_JWT_REFRESH_SECRET', {
      infer: true,
    });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /** Hash determinista (SHA-256 + pepper) para almacenar/buscar refresh tokens. */
  hashToken(token: string): string {
    return createHash('sha256')
      .update(`${this.tokenPepper}:${token}`)
      .digest('hex');
  }

  /** Comparación en tiempo constante de dos hashes hex. */
  safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }

  generateNumericCode(length = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) code += randomInt(0, 10).toString();
    return code;
  }

  generateSecureToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }
}
