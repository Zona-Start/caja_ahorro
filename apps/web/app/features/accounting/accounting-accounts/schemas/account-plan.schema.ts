import { z } from 'zod';

export const accountPlanSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  code: z.string(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  description: z.string().optional().nullable(),
  accountType: z.enum(
    ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'MEMORANDUM'],
    {
      required_error: 'El tipo de cuenta es requerido',
      invalid_type_error: 'Tipo de cuenta inválido',
    },
  ),
  nature: z.enum(['DEBIT', 'CREDIT']).optional(),
  level: z
    .number()
    .min(1, 'El nivel debe ser mayor a 0')
    .max(4, 'El nivel no puede ser mayor a 4'),
  allowsMovements: z.boolean(),
  isActive: z.boolean(),
  parentAccountId: z.number().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.number().optional(),
  updateById: z.number().optional(),
});

export type AccountPlan = z.infer<typeof accountPlanSchema>;

export const accountPlanResponseSchema = z.object({
  message: z.string(),
  data: accountPlanSchema,
});

export const accountPlanDeleteResponseSchema = z.object({
  message: z.string(),
});

export const accountPlanListResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountPlanSchema),
});

export const accountPlanPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountPlanSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});
