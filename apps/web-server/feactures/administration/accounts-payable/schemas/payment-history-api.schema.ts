import { z } from 'zod';

export const paymentHistoryItemSchema = z.object({
  id: z.number(),
  paymentNumber: z.string(),
  totalAmount: z.string(),
  processedAt: z.string().nullable(),
  requestedAt: z.string(),
  lines: z.array(
    z.object({
      amount: z.string(),
      description: z.string().nullable(),
    }),
  ),
});

export const paymentHistoryResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(paymentHistoryItemSchema),
});

export const appliedTransactionItemSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  transactionType: z.string(),
  amount: z.string(),
  transactionDate: z.string(),
  reference: z.string().nullable(),
});

export const appliedTransactionsResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(appliedTransactionItemSchema).optional(),
});
