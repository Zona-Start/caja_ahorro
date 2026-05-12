import { z } from 'zod';

export const supplierPaymentApiSchema = z.object({
  id: z.number(),
  supplierName: z.string(),
  paymentDescription: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  paymentMethod: z.string(),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.string(),
  status: z.string(),
  accountPayableReference: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierPaymentApi = z.infer<typeof supplierPaymentApiSchema>;

export const supplierPaymentListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierPaymentApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
    })
    .optional(),
});

export const supplierPaymentResponseSchema = z.object({
  message: z.string().optional(),
  data: supplierPaymentApiSchema,
});

export const supplierPaymentPendingSchema = z.array(supplierPaymentApiSchema);

export const supplierPaymentHistorySchema = z.array(
  z.object({
    id: z.number(),
    paymentDate: z.string(),
    amount: z.number(),
    currencyCode: z.string(),
    paymentMethod: z.string(),
    status: z.string(),
    reference: z.string().optional().nullable(),
  }),
);
