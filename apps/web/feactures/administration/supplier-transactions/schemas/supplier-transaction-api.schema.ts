import { z } from 'zod';

export const supplierTransactionApiSchema = z.object({
  id: z.number(),
  accountsPayableId: z.number(),
  transactionType: z.string(),
  transactionDate: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  paymentMethod: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  status: z.string(),
  accountsPayable: z.object({
    supplierInvoice: z.object({
      invoiceNumber: z.string(),
      supplierName: z.string(),
    }).optional(),
  }).optional(),
});

export type SupplierTransactionSchemaAPI = z.infer<typeof supplierTransactionApiSchema>;

export const supplierTransactionMutationResponseSchema = z.object({
  message: z.string(),
});

export const supplierTransactionAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierTransactionApiSchema),
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

export const supplierTransactionResponseOneSchema = z.object({
  message: z.string(),
  data: supplierTransactionApiSchema,
});
