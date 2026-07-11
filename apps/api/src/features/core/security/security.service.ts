import { Inject, Injectable } from '@nestjs/common';

export const BCRYPT_SERVICE = 'BCRYPT_SERVICE';

export interface IBcryptService {
  hash(password: string, saltRounds?: number): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}

@Injectable()
export class SecurityService {
  constructor(
    @Inject('BCRYPT_SERVICE') private readonly bcrypt: IBcryptService,
  ) {}

  async hashPassword(password: string, saltRounds?: number): Promise<string> {
    return this.bcrypt.hash(password, saltRounds || 12);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return this.bcrypt.compare(password, hashedPassword);
  }

  generateRandomString(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
