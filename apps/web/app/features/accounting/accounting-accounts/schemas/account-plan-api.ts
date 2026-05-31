import z from 'zod';

export const accountPlanApiResponseSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  accountType: z.enum([
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
    'MEMORANDUM',
  ]),
  nature: z.enum(['DEBIT', 'CREDIT']).optional(),
  level: z.union([z.number(), z.string()]).nullable(),
  allowsMovements: z.boolean(),
  isActive: z.boolean(),
  parentAccountId: z.string().uuid().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.string().uuid().optional().nullable(),
  updateById: z.string().uuid().optional().nullable(),
});

export type AccountPlanApiResponse = z.infer<
  typeof accountPlanApiResponseSchema
>;

export const accountPlanListApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(accountPlanApiResponseSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .nullable()
    .optional(),
});
