import { z } from 'zod';

export const CreateBankReconciliationSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  statementDate: z.coerce.date(),
  statementEndingBalance: z.coerce.number(),
  notes: z.string().optional(),
});

export const AddReconciliationDetailSchema = z.object({
  bankTransactionId: z.string().uuid().optional(),
  accountingEntryDetailId: z.string().uuid().optional(),
  adjustmentType: z.string().optional(),
  adjustmentAmount: z.coerce.number().optional(),
  description: z.string().optional(),
  isBookAdjustment: z.boolean().optional(),
});

export const FilterBankReconciliationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  bankAccountId: z.string().uuid().optional(),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  sortBy: z.string().optional().default('statementDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const AddManualMovementSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.coerce.date(),
  valueDate: z.coerce.date().optional(),
  description: z.string().min(1),
  category: z.string().min(1),
  bankReference: z.string().max(100).optional(),
  paymentMethod: z.string().min(1),
  debitAmount: z.coerce.number().optional().default(0),
  creditAmount: z.coerce.number().optional().default(0),
  resultingBalance: z.coerce.number().optional(),
  note: z.string().optional(),
});

export const BulkAddMovementsSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  statementDate: z.coerce.date(),
  statementEndingBalance: z.coerce.number(),
  notes: z.string().optional(),
  movements: z.array(
    z.object({
      transactionDate: z.coerce.date(),
      valueDate: z.coerce.date().optional(),
      description: z.string().min(1),
      category: z.string().min(1),
      bankReference: z.string().max(100).optional(),
      paymentMethod: z.string().min(1),
      debitAmount: z.coerce.number().optional().default(0),
      creditAmount: z.coerce.number().optional().default(0),
      resultingBalance: z.coerce.number().optional(),
      note: z.string().optional(),
    }),
  ),
});

export const FilterBankTransactionsForReconciliationSchema = z.object({
  bankAccountId: z.string().uuid(),
  reconciliationStatus: z.string().optional(),
  search: z.string().optional(),
});

export type CreateBankReconciliationDto = z.infer<
  typeof CreateBankReconciliationSchema
>;
export type AddReconciliationDetailDto = z.infer<
  typeof AddReconciliationDetailSchema
>;
export type FilterBankReconciliationDto = z.infer<
  typeof FilterBankReconciliationSchema
>;
export type AddManualMovementDto = z.infer<typeof AddManualMovementSchema>;
export type BulkAddMovementsDto = z.infer<typeof BulkAddMovementsSchema>;
export type FilterBankTransactionsForReconciliationDto = z.infer<
  typeof FilterBankTransactionsForReconciliationSchema
>;
