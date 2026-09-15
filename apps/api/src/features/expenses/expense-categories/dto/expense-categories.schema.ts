import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido').max(255),
  accountingAccountId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});
export class CreateExpenseCategoryDto extends createZodDto(
  CreateExpenseCategorySchema,
) {}

export const UpdateExpenseCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  accountingAccountId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});
export class UpdateExpenseCategoryDto extends createZodDto(
  UpdateExpenseCategorySchema,
) {}

export const FilterExpenseCategorySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});
export class FilterExpenseCategoryDto extends createZodDto(
  FilterExpenseCategorySchema,
) {}
