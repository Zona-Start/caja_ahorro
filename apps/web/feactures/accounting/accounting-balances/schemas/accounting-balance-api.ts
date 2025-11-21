import z from 'zod';
import { accountingBalanceSchema } from './accounting-balance.schema';

export const accountingBalanceApiResponseSchema = z.object({
  message: z.string(),
  data: accountingBalanceSchema,
});

export const accountingBalanceListApiResponseSchema = z.object({
  data: z.array(accountingBalanceSchema),
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

export const bootstrappingResponseSchema = z.object({
  message: z.string(),
  stats: z.object({
    count: z.number(),
    totalAmount: z.number(),
  }),
});

export const closeCycleResponseSchema = z.object({
  message: z.string(),
});

export const openCycleResponseSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
  status: z.string(),
});
