import { z } from 'zod';

export const supplierPaymentLineApiSchema = z.object({
  id: z.number(),
  supplierPaymentId: z.number(),
  accountsPayableId: z.number().nullable(),
  amount: z.string(), // numeric from db is string
  description: z.string().nullable(),
});

export const supplierPaymentApiSchema = z.object({
  id: z.number(),
  paymentNumber: z.string(),
  supplierId: z.number(),
  totalAmount: z.string(),
  currencyCode: z.string(),
  paymentMethod: z.string(),
  bankAccountId: z.number().nullable(),
  status: z.string(),
  requestedAt: z.string(), // date as string
  processedAt: z.string().nullable(),
  reversedAt: z.string().nullable(),
  observations: z.string().nullable(),
  // Relations
  supplier: z.object({ name: z.string() }).optional(),
  lines: z.array(supplierPaymentLineApiSchema).optional(),
});

export type SupplierPaymentAPI = z.infer<typeof supplierPaymentApiSchema>;

export const supplierPaymentAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierPaymentApiSchema),
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

export const supplierPaymentResponseOneSchema = z.object({
  message: z.string().optional(),
  data: supplierPaymentApiSchema,
});

export const supplierPaymentMutationResponseSchema = z.object({
  message: z.string().optional(),
  data: supplierPaymentApiSchema.optional(),
});
