import z from 'zod';
import { accountingBalanceSchema } from './accounting-balance.schema';

export const accountingBalanceApiResponseSchema = z.object({
  message: z.string(),
  data: accountingBalanceSchema.optional(),
  closingEntryId: z.string().optional(),
});

export const accountingBalanceListApiResponseSchema = z.object({
  data: z.array(accountingBalanceSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export const bootstrappingResponseSchema = z.object({
  message: z.string(),
  processedAccounts: z.number().optional(),
});

export const closeCycleResponseSchema = z.object({
  message: z.string(),
  closingEntryId: z.string().optional(),
});

export const openCycleResponseSchema = z.object({
  message: z.string(),
});
