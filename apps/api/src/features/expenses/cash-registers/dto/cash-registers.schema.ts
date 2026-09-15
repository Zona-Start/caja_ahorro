import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCashRegisterSchema = z.object({
  name: z.string().min(1, 'El nombre de la caja es requerido').max(100),
  isActive: z.boolean().optional().default(true),
});
export class CreateCashRegisterDto extends createZodDto(
  CreateCashRegisterSchema,
) {}

export const UpdateCashRegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});
export class UpdateCashRegisterDto extends createZodDto(
  UpdateCashRegisterSchema,
) {}

export const FilterCashRegisterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.string().optional(),
});
export class FilterCashRegisterDto extends createZodDto(
  FilterCashRegisterSchema,
) {}
