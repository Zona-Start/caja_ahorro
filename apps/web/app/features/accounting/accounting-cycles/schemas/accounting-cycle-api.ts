import { z } from 'zod';

export const accountingCycleApiSchema = z.object({
  id: z.number().optional(),
  companyId: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  description: z.string(),
  closedAt: z.string().optional().nullable(),
  closedByUser_id: z.number().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.number().optional(),
  updateById: z.number().optional().nullable(),
});

export type AccountingCycleApi = z.infer<typeof accountingCycleApiSchema>;

export const accountingCycleResponseSchema = z.object({
  message: z.string(),
  data: accountingCycleApiSchema,
});

export const accountingCycleDeleteResponseSchema = z.object({
  message: z.string(),
});

export const accountingCycleListResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingCycleApiSchema),
});

export const accountingCyclePaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingCycleApiSchema),
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
