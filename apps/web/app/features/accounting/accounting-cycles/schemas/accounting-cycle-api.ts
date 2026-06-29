import { z } from 'zod';
import { CycleStatusEnum } from './accounting-cycle-options';

export const accountingCycleApiSchema = z.object({
  id: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.nativeEnum(CycleStatusEnum),
  description: z.string(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
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
  }),
});
