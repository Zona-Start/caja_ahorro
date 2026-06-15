import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTenantSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  description: z.string().max(255).optional(),
  category: z.string().max(50).default('general'),
  moduleCode: z
    .enum([
      'ACCOUNTING',
      'LOANS',
      'CREDITS',
      'SAVINGS',
      'INVENTORY',
      'PURCHASING',
      'BILLING',
      'BANKING',
      'TREASURY',
      'HR_PAYROLL',
      'SETTLEMENT',
      'AUDIT',
    ])
    .optional(),
});

export const UpdateTenantSettingSchema = z.object({
  value: z.string().optional(),
});

export const TenantSettingQuerySchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().optional(),
  category: z.string().optional(),
  moduleCode: z
    .enum([
      'ACCOUNTING',
      'LOANS',
      'CREDITS',
      'SAVINGS',
      'INVENTORY',
      'PURCHASING',
      'BILLING',
      'BANKING',
      'TREASURY',
      'HR_PAYROLL',
      'SETTLEMENT',
      'AUDIT',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export class CreateTenantSettingDto extends createZodDto(CreateTenantSettingSchema) {}
export class UpdateTenantSettingDto extends createZodDto(UpdateTenantSettingSchema) {}
export class TenantSettingQueryDto extends createZodDto(TenantSettingQuerySchema) {}
