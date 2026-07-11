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

export type CreateBankReconciliationDto = z.infer<
  typeof CreateBankReconciliationSchema
>;
export type AddReconciliationDetailDto = z.infer<
  typeof AddReconciliationDetailSchema
>;
export type FilterBankReconciliationDto = z.infer<
  typeof FilterBankReconciliationSchema
>;
