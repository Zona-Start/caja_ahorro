import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

@Injectable()
export class CryptographyService {
  private readonly logger = new Logger(CryptographyService.name);
  private readonly key: Buffer;

  constructor() {
    const password = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!password) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for NIST 800-57 compliance',
      );
    }
    this.key = scryptSync(password, 'nitro-salt', 32);
  }

  async encrypt(plaintext: string): Promise<string> {
    try {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Encryption failed: ${errorMessage}`);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Decryption failed: ${errorMessage}`);
      throw new Error('Failed to decrypt data');
    }
  }

  async hashToken(token: string): Promise<string> {
    const iv = randomBytes(SALT_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    let hashed = cipher.update(token, 'utf8', 'hex');
    hashed += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${hashed}`;
  }

  async verifyToken(token: string, storedHash: string): Promise<boolean> {
    try {
      const decrypted = await this.decrypt(storedHash);
      return token === decrypted;
    } catch {
      return false;
    }
  }

  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  hashData(data: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, salt);

    let hashed = cipher.update(data, 'utf8', 'hex');
    hashed += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${salt.toString('hex')}:${authTag.toString('hex')}:${hashed}`;
  }
}
