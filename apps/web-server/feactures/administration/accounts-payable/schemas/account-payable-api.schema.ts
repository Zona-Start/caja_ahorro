import { z } from 'zod';

//scehama paa consulta datos de cuenta por pagar
export const accountPayableApiSchema = z.object({
  id: z.number(),
  accountsPayableNumber: z.string(),
  supplierName: z.string().nullable(),
  supplierId: z.number().nullable(),
  supplierInvoiceId: z.number().nullable(),
  supplierInvoiceNumber: z.string().nullable(),
  originalAmount: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
  status: z.string(),
  observations: z.string().optional().nullable(),
  isAuthorizePayment: z.boolean(),
  supplierInvoice: z
    .object({
      invoiceNumber: z.string().nullable(),
    })
    .optional()
    .nullable(),
  createdAt: z.string(),
  dueDate: z.string().nullable(),
});

export type AccountPayableSchemaAPI = z.infer<typeof accountPayableApiSchema>;

//scehama paa mutacion anular  cuenta por pagar y autorizar  pago
export const accountPayableMutationResponseSchema = z.object({
  message: z.string(),
});

//scehama paa consulta datos de cuenta por pagar
export const accountPayableAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(accountPayableApiSchema),
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

export const accountPayableResponseOneSchema = z.object({
  message: z.string(),
  data: accountPayableApiSchema,
});

//response mutation advance supplier
export const supplierMutationResponseSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  transactionType: z.string(),
  transactionDate: z.string(),
  amount: z.string(),
  currencyCode: z.string(),
  status: z.string(),
  observations: z.string().nullable(),
  createdById: z.number(),
});

export const supplierMutationResponseApiSchema = z.object({
  message: z.string(),
  data: supplierMutationResponseSchema,
});
