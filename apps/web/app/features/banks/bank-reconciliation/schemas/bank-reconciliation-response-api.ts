import { z } from 'zod';

export const bankReconciliationApiSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  statementDate: z.string(),
  statementEndingBalance: z.number().nullable().optional(),
  bookBalanceBefore: z.number().nullable().optional(),
  bookBalanceAfter: z.number().nullable().optional(),
  difference: z.number().nullable().optional(),
  reconciliationDate: z.string().nullable().optional(),
  status: z.string(),
  preparedByUserId: z.string().uuid().nullable().optional(),
  reviewedByUserId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankReconciliationApi = z.infer<typeof bankReconciliationApiSchema>;

export const bankReconciliationListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankReconciliationApiSchema),
  meta: z.object({
    totalItems: z.number(),
    itemCount: z.number(),
    itemsPerPage: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }),
});

export const bankReconciliationDetailResponseSchema = z.object({
  message: z.string().optional(),
  data: bankReconciliationApiSchema.extend({
    details: z.array(
      z.object({
        id: z.string().uuid(),
        bankReconciliationId: z.string().uuid(),
        bankTransactionId: z.string().uuid().nullable().optional(),
        accountingEntryDetailId: z.string().uuid().nullable().optional(),
        adjustmentType: z.string().nullable().optional(),
        adjustmentAmount: z.number().nullable().optional(),
        description: z.string().nullable().optional(),
        isBookAdjustment: z.boolean().nullable().optional(),
        createdAt: z.string().optional(),
      }),
    ),
    transactions: z.array(
      z.object({
        id: z.string().uuid(),
        bankAccountId: z.string().uuid(),
        transactionDate: z.string(),
        valueDate: z.string().nullable().optional(),
        description: z.string(),
        category: z.string(),
        bankReference: z.string().nullable().optional(),
        paymentMethod: z.string(),
        debitAmount: z.number().nullable().optional(),
        creditAmount: z.number().nullable().optional(),
        resultingBalance: z.number().nullable().optional(),
        reconciliationStatus: z.string(),
        internalCode: z.string(),
        internalLinkStatus: z.string(),
        note: z.string().nullable().optional(),
      }),
    ),
  }),
});

export const bankTransactionApiSchema = z.object({
  id: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.string(),
  valueDate: z.string().nullable().optional(),
  description: z.string(),
  category: z.string(),
  bankReference: z.string().nullable().optional(),
  paymentMethod: z.string(),
  debitAmount: z.number().nullable().optional(),
  creditAmount: z.number().nullable().optional(),
  resultingBalance: z.number().nullable().optional(),
  reconciliationStatus: z.string(),
  internalCode: z.string(),
  internalLinkStatus: z.string(),
  note: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type BankTransactionApi = z.infer<typeof bankTransactionApiSchema>;
