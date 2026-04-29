import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
  rif: z.string().min(1).max(20),
  email: z.string().email().min(1).max(100),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(100).optional(),
  contactCedula: z.string().max(20).optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().min(1).max(100).optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(100).optional(),
  contactCedula: z.string().max(20).optional(),
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
    z.boolean().optional()
  ),
});

export class TenantQueryDto extends createZodDto(TenantQuerySchema) {}
