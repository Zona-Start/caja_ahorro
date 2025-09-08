import { z } from 'zod';

export const supplierPaymentLineSchema = z.object({
  id: z.number(),
  supplierPaymentId: z.number(),
  accountsPayableId: z.number().nullable(),
  amount: z.number(),
  description: z.string().nullable(),
});

export const supplierPaymentSchema = z.object({
  id: z.number(),
  paymentNumber: z.string(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  totalAmount: z.number(),
  currencyCode: z.string(),
  paymentMethod: z.string(),
  bankAccountId: z.number().nullable(),
  status: z.string(),
  requestedAt: z.string(),
  processedAt: z.string().nullable(),
  reversedAt: z.string().nullable(),
  observations: z.string().nullable(),
  lines: z.array(supplierPaymentLineSchema),
});

export const supplierPaymentAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierPaymentSchema),
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

export const reversePaymentMutationResponseSchema = z.object({
  message: z.string(),
});

export type SupplierPayment = z.infer<typeof supplierPaymentSchema>;