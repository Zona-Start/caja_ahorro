import { z } from 'zod';

export const accountsPayableApiSchema = z.object({
  id: z.number(),
  supplierName: z.string(),
  supplierTaxId: z.string(),
  invoiceNumber: z.string(),
  originalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  currencyCode: z.string(),
  status: z.enum(['PENDING', 'AUTHORIZED', 'PAID', 'CANCELLED']),
  dueDate: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  isAuthorizePayment: z.boolean(),
  observations: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AccountsPayableApi = z.infer<typeof accountsPayableApiSchema>;

export const accountsPayableMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean().optional().nullable(),
  hasPreviousPage: z.boolean().optional().nullable(),
  nextPage: z.number().optional().nullable(),
  previousPage: z.number().optional().nullable(),
});

export const accountsPayableListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(accountsPayableApiSchema),
  meta: accountsPayableMetaSchema,
});

export const accountsPayableResponseSchema = z.object({
  message: z.string().optional(),
  data: accountsPayableApiSchema,
});

export const appliedTransactionApiSchema = z.object({
  id: z.number(),
  paymentMethod: z.string(),
  amount: z.number(),
  reference: z.string().optional().nullable(),
  transactionDate: z.string(),
  note: z.string().optional().nullable(),
});

export type AppliedTransactionApi = z.infer<typeof appliedTransactionApiSchema>;

export const appliedTransactionsListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(appliedTransactionApiSchema),
});

export type AccountsPayableMeta = z.infer<typeof accountsPayableMetaSchema>;
export type AccountsPayableListResponse = z.infer<
  typeof accountsPayableListResponseSchema
>;
export type AccountsPayableResponse = z.infer<
  typeof accountsPayableResponseSchema
>;
export type AppliedTransactionsListResponse = z.infer<
  typeof appliedTransactionsListResponseSchema
>;
