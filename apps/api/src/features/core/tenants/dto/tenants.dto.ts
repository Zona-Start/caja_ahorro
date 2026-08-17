import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MODULE_CODES = [
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
  'AUDIT',
] as const;

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
  rif: z.string().min(1).max(20),
  email: z.string().email().min(1).max(100),
  businessType: z
    .enum(['CAJA_AHORRO', 'EMPRESA_COMERCIAL'])
    .default('CAJA_AHORRO'),
  moduleCodes: z.array(z.enum(MODULE_CODES)).optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(100).optional(),
  contactCedula: z.string().max(20).optional(),
  slug: z
    .string()
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
    .optional(),
  logoKey: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconKey: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().max(9).optional(),
  secondaryColor: z.string().max(9).optional(),
  loginMode: z.enum(['CUSTOM_DOMAIN', 'SUBDOMAIN']).optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().min(1).max(100).optional(),
  businessType: z.enum(['CAJA_AHORRO', 'EMPRESA_COMERCIAL']).optional(),
  moduleCodes: z.array(z.enum(MODULE_CODES)).optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(100).optional(),
  contactCedula: z.string().max(20).optional(),
  slug: z
    .string()
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
    .optional(),
  logoKey: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconKey: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().max(9).optional(),
  secondaryColor: z.string().max(9).optional(),
  loginMode: z.enum(['CUSTOM_DOMAIN', 'SUBDOMAIN']).optional(),
  isActive: z.boolean().optional(),
});

export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}
export class UpdateTenantDto extends createZodDto(UpdateTenantSchema) {}

export const TenantQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional(),
  ),
  businessType: z.enum(['CAJA_AHORRO', 'EMPRESA_COMERCIAL']).optional(),
});

export class TenantQueryDto extends createZodDto(TenantQuerySchema) {}
