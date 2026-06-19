import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const moduleCodeValues = [
  'ACCOUNTING',
  'LOANS',
  'CREDITS',
  'SAVINGS',
  'INVENTORY',
  'PURCHASING',
  'SALES',
  'BANKING',
  'TREASURY',
  'HR_PAYROLL',
  'SETTLEMENT',
  'AUDIT',
] as const;

export const ToggleModuleSchema = z.object({
  moduleCode: z.enum(moduleCodeValues),
  status: z.enum(['ENABLED', 'DISABLED', 'SETUP_REQUIRED']).default('ENABLED'),
});

export const TenantModuleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['ENABLED', 'DISABLED', 'SETUP_REQUIRED']).optional(),
});

export class ToggleModuleDto extends createZodDto(ToggleModuleSchema) { }
export class TenantModuleQueryDto extends createZodDto(TenantModuleQuerySchema) { }
