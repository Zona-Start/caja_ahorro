import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCostCenterSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  monthlyBudget: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional().default(true),
});
export class CreateCostCenterDto extends createZodDto(CreateCostCenterSchema) {}

export const UpdateCostCenterSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  monthlyBudget: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
});
export class UpdateCostCenterDto extends createZodDto(UpdateCostCenterSchema) {}

export const FilterCostCenterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});
export class FilterCostCenterDto extends createZodDto(FilterCostCenterSchema) {}

export const BudgetUsageSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El mes debe tener el formato YYYY-MM')
    .optional(),
});
export class BudgetUsageDto extends createZodDto(BudgetUsageSchema) {}
