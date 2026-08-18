import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client | null;
  private readonly missingVariables: string[] = [];

  constructor(private readonly configService: ConfigService) {
    const required: Array<[string, string | undefined]> = [
      ['R2_ACCOUNT_ID', this.configService.get<string>('R2_ACCOUNT_ID')],
      ['R2_ACCESS_KEY_ID', this.configService.get<string>('R2_ACCESS_KEY_ID')],
      [
        'R2_SECRET_ACCESS_KEY',
        this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
      ],
      ['R2_BUCKET_NAME', this.configService.get<string>('R2_BUCKET_NAME')],
    ];

    this.missingVariables = required
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (this.missingVariables.length > 0) {
      this.client = null;
      this.logger.warn(
        `R2 no configurado. Faltan: ${this.missingVariables.join(', ')}`,
      );
      return;
    }

    const accountId = required[0][1]!;
    const accessKeyId = required[1][1]!;
    const secretAccessKey = required[2][1]!;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getMissingVariables(): string[] {
    return this.missingVariables;
  }

  getBucketName(): string {
    return this.configService.get<string>('R2_BUCKET_NAME') ?? '';
  }

  getPublicUrl(key: string): string {
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const bucket = this.getBucketName();
    return `https://${bucket}.${accountId}.r2.dev/${key}`;
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    if (!this.client) {
      throw new Error('R2 no está configurado');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return { key, url: this.getPublicUrl(key) };
  }

  async remove(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('R2 no está configurado');
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.client) {
      throw new Error('R2 no está configurado');
    }

    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
      }),
      { expiresIn },
    );
  }
}
