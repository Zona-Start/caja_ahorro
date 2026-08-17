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

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      this.client = null;
      this.logger.warn(
        'R2 no configurado: faltan variables R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_BUCKET_NAME',
      );
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
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
