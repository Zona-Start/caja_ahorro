import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { z } from 'zod';
import { R2Service } from './r2.service';

const SignSchema = z.object({
  key: z.string().min(1),
  expiresIn: z.number().int().positive().max(86400).optional(),
});

@Controller('storage')
export class StorageController {
  constructor(
    private readonly r2Service: R2Service,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @Req() req: Request,
  ) {
    if (!this.r2Service.isConfigured()) {
      throw new BadRequestException(
        `R2 no está configurado. Faltan: ${this.r2Service.getMissingVariables().join(', ')}`,
      );
    }

    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const tenantId = this.tenantContext.getTenantId() || 'public';
    const safeFolder = (folder || 'general')
      .replace(/[^a-zA-Z0-9-_/]/g, '')
      .replace(/^\/+|\/+$/g, '');
    const extension = file.originalname.split('.').pop() || 'bin';
    const key = `tenants/${tenantId}/${safeFolder}/${randomBytes(12).toString('hex')}.${extension}`;

    const result = await this.r2Service.upload(
      key,
      file.buffer,
      file.mimetype || 'application/octet-stream',
    );

    return result;
  }

  @Post('sign')
  async sign(@Body() body: { key?: string; expiresIn?: number }) {
    const { key, expiresIn } = SignSchema.parse({
      key: body.key,
      expiresIn: body.expiresIn,
    });

    if (!this.r2Service.isConfigured()) {
      throw new BadRequestException(
        `R2 no está configurado. Faltan: ${this.r2Service.getMissingVariables().join(', ')}`,
      );
    }

    const url = await this.r2Service.getSignedUrl(key, expiresIn);
    return { url };
  }
}
