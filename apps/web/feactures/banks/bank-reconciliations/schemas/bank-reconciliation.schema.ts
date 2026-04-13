import { z } from 'zod';

export const bankReconciliationSchema = z.object({
  id: z.number().optional(),
  bankAccountId: z.number().min(1, { message: 'Requerido' }),
  statementDate: z.date({ required_error: 'Requerido' }),
  statementEndingBalance: z.number().min(0, { message: 'Debe ser mayor o igual a 0' }),
  notes: z.string().optional().nullable(),
});
export type BankReconciliation = z.infer<typeof bankReconciliationSchema>;

export const addReconciliationDetailSchema = z.object({
  bankTransactionId: z.number().optional().nullable(),
  accountingEntryDetailId: z.number().optional().nullable(),
  adjustmentType: z.string().optional().nullable(),
  adjustmentAmount: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  isBookAdjustment: z.boolean().optional(),
});
export type AddReconciliationDetail = z.infer<typeof addReconciliationDetailSchema>;




export const bankReconciliationAllSchema = z.object({
  id: z.number().optional(),
  bankAccountId: z.number().min(1, { message: 'Requerido' }),
  statementDate: z.string({ required_error: 'Requerido' }),
  statementEndingBalance: z.string().min(0, { message: 'Debe ser mayor o igual a 0' }),
  bookBalanceBefore: z.string().min(0, { message: 'Debe ser mayor o igual a 0' }),
  bookBalanceAfter: z.string().nullable(),
  difference: z.string().nullable(),
  status: z.string().optional().nullable(),
  reconciliationDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  preparedByUserId: z.number().optional().nullable(),
  reviewedByUserId: z.number().optional().nullable(),
  createdById: z.number().optional().nullable(),
  updatedById: z.number().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});
export type BankReconciliationAll = z.infer<typeof bankReconciliationAllSchema>;


export const bankReconciliationAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(bankReconciliationAllSchema),
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
