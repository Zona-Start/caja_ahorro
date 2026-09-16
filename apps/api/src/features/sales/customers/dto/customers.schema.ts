import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  tenantId: z.string().uuid().optional(),
  /** Full name of the customer (UI composes first + last name). */
  name: z.string().min(1, 'El nombre es requerido').max(255),
  /** Cédula / RIF / documento fiscal. */
  taxId: z.string().min(1, 'La cédula es requerida').max(50),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  creditDays: z.coerce.number().int().min(0).default(0),
  creditLimit: z.coerce.number().min(0).default(0),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}

export const FilterCustomerSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  tenantId: z.string().uuid().optional(),
});
export class FilterCustomerDto extends createZodDto(FilterCustomerSchema) {}
