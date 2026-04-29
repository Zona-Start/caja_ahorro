import { Injectable } from '@nestjs/common';
import { IBcryptService } from './security.service';

@Injectable()
export class BcryptService implements IBcryptService {
  async hash(password: string, saltRounds: number = 12): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hashedPassword);
  }
}