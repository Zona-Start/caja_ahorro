import { z } from 'zod';

const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'OTHER',
  'MOBILE_PAYMENT',
]);
const categoryEnum = z.enum([
  'MEMBER_CONTRIBUTION',
  'MEMBER_WITHDRAWAL',
  'PAYROLL_SETTLEMENT',
  'LOAN_DISBURSEMENT',
  'LOAN_PAYMENT',
  'CREDIT_DISBURSEMENT',
  'CREDIT_PAYMENT',
  'BATCH_DISBURSEMENT',
  'SUPPLIER_PAYMENT',
  'SUPPLIER_ADVANCE_PAYMENT',
  'INTERNAL_TRANSFER',
  'BANK_FEE',
  'INTEREST_EARNED',
  'INTEREST_CHARGED',
  'BANK_ADJUSTMENT',
  'TAX_DEBIT',
  'TAX_CREDIT',
  'OTHER_INCOME',
  'OTHER_EXPENSE',
  'OPENING_BANK',
  'CLOSING_BANK',
]);

export const CreateBankMovementSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.coerce.date(),
  paymentMethod: paymentMethodEnum,
  description: z.string().min(1),
  bankReference: z.string().optional(),
  category: categoryEnum.optional(),
  creditAmount: z.coerce.number().nonnegative().default(0),
  debitAmount: z.coerce.number().nonnegative().default(0),
  valueDate: z.coerce.date().optional(),
  note: z.string().optional().nullable(),
});

export const UpdateBankMovementSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  transactionDate: z.coerce.date().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  description: z.string().min(1).optional(),
  bankReference: z.string().optional(),
  category: categoryEnum.optional(),
  creditAmount: z.coerce.number().nonnegative().optional(),
  debitAmount: z.coerce.number().nonnegative().optional(),
  valueDate: z.coerce.date().optional(),
  note: z.string().optional().nullable(),
});

export const CreateAndReconcileSchema = z.object({
  tenantId: z.string().uuid().optional(),
  movement: CreateBankMovementSchema,
  links: z
    .array(
      z.object({
        internalRecordType: z.string(),
        internalRecordId: z.string(),
      }),
    )
    .optional(),
});

export const FilterBankMovementSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  category: categoryEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reconciliationStatus: z.string().optional(),
  internalLinkStatus: z.string().optional(),
  sortBy: z.string().optional().default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const LinkToInternalSchema = z.object({
  internalRecordType: z.string(),
  internalRecordId: z.string(),
});

export const ReverseMovementSchema = z.object({
  valueDate: z.coerce.date(),
  reason: z.string().optional(),
});

export const GetLinkablesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  q: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateBankMovementDto = z.infer<typeof CreateBankMovementSchema>;
export type UpdateBankMovementDto = z.infer<typeof UpdateBankMovementSchema>;
export type CreateAndReconcileDto = z.infer<typeof CreateAndReconcileSchema>;
export type FilterBankMovementDto = z.infer<typeof FilterBankMovementSchema>;
export type LinkToInternalDto = z.infer<typeof LinkToInternalSchema>;
export type ReverseMovementDto = z.infer<typeof ReverseMovementSchema>;
export type GetLinkablesDto = z.infer<typeof GetLinkablesSchema>;
