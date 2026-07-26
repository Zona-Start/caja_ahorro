import { z } from 'zod';

export const supplierPaymentApiSchema = z.object({
  id: z.string(),
  paymentNumber: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  totalAmount: z.coerce.number(),
  currencyCode: z.string().optional(),
  paymentMethod: z.string().optional(),
  bankReference: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  bankTransactionDate: z.string().optional().nullable(),
  status: z.string(),
  accountPayableNumber: z.string().optional().nullable(),
  lines: z.array(z.object({
    amount: z.coerce.number(),
    accountsPayableId: z.string().optional().nullable(),
    relatedAdvanceId: z.any().optional().nullable(),
    description: z.string().optional().nullable(),
  })).optional(),
  requestedAt: z.string().optional(),
  processedAt: z.string().optional().nullable(),
  reversedAt: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  createdAt: z.string().optional(),
});

export type SupplierPaymentApi = z.infer<typeof supplierPaymentApiSchema>;

export const pendingPaymentApiSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  reference: z.string(),
  amount: z.coerce.number(),
  status: z.string(),
  date: z.string(),
  type: z.enum(['ACCOUNTS_PAYABLE', 'ADVANCE']),
});

export type PendingPaymentApi = z.infer<typeof pendingPaymentApiSchema>;

export const supplierPaymentListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierPaymentApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean().optional().nullable(),
    hasPreviousPage: z.boolean().optional().nullable(),
  }),
});

export const supplierPaymentResponseSchema = z.object({
  message: z.string().optional(),
  data: supplierPaymentApiSchema,
});

export const pendingPaymentsResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(pendingPaymentApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean().optional().nullable(),
    hasPreviousPage: z.boolean().optional().nullable(),
  }),
});

export const supplierPaymentHistorySchema = z.array(
  z.object({
    id: z.string(),
    paymentDate: z.string(),
    amount: z.coerce.number(),
    currencyCode: z.string(),
    paymentMethod: z.string(),
    status: z.string(),
    reference: z.string().optional().nullable(),
  }),
);

export const availableCreditsSchema = z.array(
  z.object({
    id: z.string(),
    transactionNumber: z.string(),
    transactionType: z.string(),
    availableAmount: z.coerce.number(),
  }),
);

export type AvailableCredit = z.infer<typeof availableCreditsSchema>[number];

export const creditItemSchema = z.object({
  id: z.string(),
  transactionNumber: z.string(),
  transactionType: z.string(),
  amount: z.coerce.number(),
  availableAmount: z.coerce.number(),
  status: z.string(),
  date: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  observations: z.string().optional().nullable(),
});

export type CreditItem = z.infer<typeof creditItemSchema>;

export const allCreditsResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    items: z.array(creditItemSchema),
    summary: z.object({
      totalAvailable: z.coerce.number(),
      advanceCount: z.number(),
      creditNoteCount: z.number(),
      totalCount: z.number(),
    }),
  }),
});
