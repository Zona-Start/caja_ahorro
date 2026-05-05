import z from 'zod';

export const accountPlanApiResponseSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
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
  level: z.number().nullable(),
  allowsMovements: z.boolean(),
  isActive: z.boolean(),
  parentAccountId: z.number().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.number().optional(),
  updateById: z.number().optional(),
});

export type AccountPlanApiResponse = z.infer<
  typeof accountPlanApiResponseSchema
>;

export const accountPlanListApiResponseSchema = z.object({
  message: z.string(),
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
    .optional(),
});
