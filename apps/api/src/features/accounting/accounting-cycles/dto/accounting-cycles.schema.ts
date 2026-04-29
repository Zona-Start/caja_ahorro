import { z } from 'zod';

export const CreateAccountingCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const FilterAccountingCycleSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
});

export const UpdateAccountingCycleSchema =
  CreateAccountingCycleSchema.partial();

export type CreateAccountingCycleDto = z.infer<
  typeof CreateAccountingCycleSchema
>;
export type FilterAccountingCycleDto = z.infer<
  typeof FilterAccountingCycleSchema
>;
export type UpdateAccountingCycleDto = z.infer<
  typeof UpdateAccountingCycleSchema
>;
