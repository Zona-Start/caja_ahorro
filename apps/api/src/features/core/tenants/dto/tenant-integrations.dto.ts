import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { moduleCodeValues } from './tenant-modules.dto';

export const ConfigureIntegrationSchema = z.object({
  sourceModule: z.enum(moduleCodeValues),
  targetModule: z.enum(moduleCodeValues),
  isEnabled: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
});

export const TenantIntegrationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  isEnabled: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional(),
  ),
});

export class ConfigureIntegrationDto extends createZodDto(ConfigureIntegrationSchema) {}
export class TenantIntegrationQueryDto extends createZodDto(TenantIntegrationQuerySchema) {}
