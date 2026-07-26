import { z } from 'zod';

export const bankReconciliationFormSchema = z.object({
  bankAccountId: z.string().uuid('La cuenta bancaria es requerida'),
  statementDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de corte es requerida' }),
  }),
  statementEndingBalance: z.coerce
    .number()
    .min(0, 'El saldo final no puede ser negativo'),
  notes: z.string().max(500).optional().nullable(),
});

export type BankReconciliationForm = z.infer<
  typeof bankReconciliationFormSchema
>;

export const bankReconciliationSchema = bankReconciliationFormSchema.extend({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bookBalanceBefore: z.number().nullable().optional(),
  bookBalanceAfter: z.number().nullable().optional(),
  difference: z.number().nullable().optional(),
  reconciliationDate: z.string().nullable().optional(),
  status: z.string(),
  preparedByUserId: z.string().uuid().nullable().optional(),
  reviewedByUserId: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankReconciliation = z.infer<typeof bankReconciliationSchema>;

export const bankMovementManualSchema = z.object({
  bankAccountId: z.string().uuid(),
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de transacción es requerida' }),
  }),
  valueDate: z.coerce.date().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  category: z.string().min(1, 'La categoría es requerida'),
  bankReference: z.string().max(100).optional().nullable(),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  debitAmount: z.coerce.number().optional().default(0),
  creditAmount: z.coerce.number().optional().default(0),
  resultingBalance: z.coerce.number().optional(),
  note: z.string().max(500).optional().nullable(),
});

export type BankMovementManualForm = z.infer<typeof bankMovementManualSchema>;

export const excelUploadSchema = z.object({
  bankAccountId: z.string().uuid('La cuenta bancaria es requerida'),
  statementDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de corte es requerida' }),
  }),
  statementEndingBalance: z.coerce
    .number()
    .min(0, 'El saldo final no puede ser negativo'),
  notes: z.string().max(500).optional().nullable(),
});

export type ExcelUploadForm = z.infer<typeof excelUploadSchema>;

export const bankTransactionSchema = z.object({
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

export type BankTransaction = z.infer<typeof bankTransactionSchema>;
