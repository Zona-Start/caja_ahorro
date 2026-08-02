import { z } from 'zod';

export const CreateBankReconciliationSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  startDate: z.coerce.date(),
  statementDate: z.coerce.date(),
  statementEndingBalance: z.coerce.number(),
  notes: z.string().optional(),
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

export const AddStatementLineSchema = z.object({
  tenantId: z.string().uuid().optional(),
  transactionDate: z.coerce.date(),
  bankReference: z.string().max(100).optional().nullable(),
  description: z.string().min(1),
  isCredit: z.boolean(),
  amount: z.coerce.number().min(0.01),
});

export const ManualMatchSchema = z.object({
  statementLineIds: z.array(z.string().uuid()).min(1),
  bankTransactionIds: z.array(z.string().uuid()).min(1),
});

export const GenerateBookEntrySchema = z.object({
  statementLineId: z.string().uuid(),
  description: z.string().min(1).optional(),
});

export type CreateBankReconciliationDto = z.infer<typeof CreateBankReconciliationSchema>;
export type FilterBankReconciliationDto = z.infer<typeof FilterBankReconciliationSchema>;
export type AddStatementLineDto = z.infer<typeof AddStatementLineSchema>;
export type ManualMatchDto = z.infer<typeof ManualMatchSchema>;
export type GenerateBookEntryDto = z.infer<typeof GenerateBookEntrySchema>;
