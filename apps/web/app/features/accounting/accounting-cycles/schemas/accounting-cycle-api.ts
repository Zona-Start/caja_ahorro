import { z } from 'zod';

export const accountingCycleApiSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  description: z.string(),
  closedAt: z.string().optional().nullable(),
  closedByUser_id: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updateById: z.string().optional().nullable(),
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
    hasNextPage: z.boolean().optional().nullable(),
    hasPreviousPage: z.boolean().optional().nullable(),
    nextPage: z.number().optional().nullable(),
    previousPage: z.number().optional().nullable(),
  }),
});
