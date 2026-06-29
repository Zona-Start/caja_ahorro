import { z } from 'zod';

export const CreateAccountingCycleSchema = z.object({
  startDate: z.string().date('Formato de fecha inválido, use YYYY-MM-DD'),
  endDate: z.string().date('Formato de fecha inválido, use YYYY-MM-DD'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres'),
});

export const UpdateAccountingCycleSchema = z.object({
  startDate: z
    .string()
    .date('Formato de fecha inválido, use YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .date('Formato de fecha inválido, use YYYY-MM-DD')
    .optional(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional(),
  status: z.enum(['OPEN', 'PENDING']).optional(),
});

export const ChangeStatusSchema = z.object({
  status: z.enum(['OPEN', 'PENDING'], {
    errorMap: () => ({
      message: 'El estado debe ser OPEN o PENDING',
    }),
  }),
});

export const FilterAccountingCycleSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z
    .string()
    .date('Formato de fecha inválido, use YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .date('Formato de fecha inválido, use YYYY-MM-DD')
    .optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateAccountingCycleDto = z.infer<
  typeof CreateAccountingCycleSchema
>;
export type UpdateAccountingCycleDto = z.infer<
  typeof UpdateAccountingCycleSchema
>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
export type FilterAccountingCycleDto = z.infer<
  typeof FilterAccountingCycleSchema
>;
