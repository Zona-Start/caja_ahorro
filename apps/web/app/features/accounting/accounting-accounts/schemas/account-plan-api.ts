import z from 'zod';

export const accountPlanApiResponseSchema = z.object({
  id: z.string().optional(),
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
  parentAccountId: z.union([z.number(), z.string(), z.null()]).nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.union([z.number(), z.string(), z.null()]).optional(),
  updateById: z.union([z.number(), z.string(), z.null()]).optional(),
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
