import { z } from 'zod';

export const paymentBatchApiSchema = z.object({
  id: z.number(),
  customReference: z.string().nullable(),
  bankAccountId: z.number(),
  currencyCode: z.string(),
  totalAmount: z.string(),
  status: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(z.unknown()).optional(),
});

export const paymentBatchApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(paymentBatchApiSchema),
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

export const paymentBatchMutationSchema = z.object({
  message: z.string(),
  paymentBatchId: z.number(),
});

export const approvedSourceItemsApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(z.unknown()),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }).optional(),
});

export type PaymentBatch = z.infer<typeof paymentBatchApiSchema>;