import { z } from 'zod';

export const PAYMENT_SOURCE_OPTIONS = {
  CASH_REGISTER: 'Caja POS',
  BANK_ACCOUNT: 'Cuenta Bancaria',
  PETTY_CASH: 'Fondo Fijo',
} as const;

export const EXPENSE_TYPE_OPTIONS = {
  EXPRESS: 'Express',
  FORMAL_INVOICE: 'Factura Formal',
} as const;

export const EXPENSE_NATURE_OPTIONS = {
  VARIABLE: 'Variable',
  FIXED: 'Fijo',
} as const;

export const EXPENSE_FREQUENCY_OPTIONS = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
} as const;

export const EXPENSE_STATUS_OPTIONS = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de Aprobación',
  APPROVED: 'Aprobado / Por Pagar',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
} as const;

export const expenseDetailLineSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid('La categoría de la línea es requerida'),
  description: z.string().min(1, 'La descripción de la línea es requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  isExempt: z.boolean().optional().default(false),
});

export const expenseBaseSchema = z.object({
  categoryId: z.string().uuid('La categoría de gasto es requerida'),
  paymentSource: z.enum(['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH'], {
    errorMap: () => ({ message: 'Selecciona la fuente del dinero' }),
  }),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'Máximo 255 caracteres'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  exchangeRate: z.coerce.number().positive().default(1),
  taxAmountBase: z.coerce.number().min(0).optional().default(0),

  // Líneas de detalle del gasto (varios conceptos)
  details: z.array(expenseDetailLineSchema).optional(),

  supplierId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  type: z.enum(['EXPRESS', 'FORMAL_INVOICE']).optional(),
  receiptNumber: z.string().max(100).optional(),
  receiptImageUrl: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),

  // Naturaleza del gasto y programación (solo fijo)
  nature: z.enum(['FIXED', 'VARIABLE']).optional().default('VARIABLE'),
  dueDate: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL']).optional(),

  cashRegisterSessionId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  pettyCashFundId: z.string().uuid().optional(),

  overrideBudget: z.boolean().optional().default(false),
});

export const expenseFormSchema = expenseBaseSchema.superRefine((data, ctx) => {
  if (data.paymentSource === 'CASH_REGISTER' && !data.cashRegisterSessionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona una caja POS activa',
      path: ['cashRegisterSessionId'],
    });
  }
  if (data.paymentSource === 'BANK_ACCOUNT' && !data.bankAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona una cuenta bancaria',
      path: ['bankAccountId'],
    });
  }
  if (data.paymentSource === 'PETTY_CASH' && !data.pettyCashFundId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona un fondo fijo',
      path: ['pettyCashFundId'],
    });
  }
  if (data.nature === 'FIXED' && !data.dueDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de pago es requerida para gastos fijos',
      path: ['dueDate'],
    });
  }
  if (data.nature === 'FIXED' && !data.frequency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La frecuencia es requerida para gastos fijos',
      path: ['frequency'],
    });
  }
});

export type ExpenseForm = z.infer<typeof expenseFormSchema>;

export const expenseSchema = expenseBaseSchema.extend({
  id: z.string().uuid(),
  amountBase: z.coerce.number().optional(),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED'])
    .default('PENDING_APPROVAL'),
  nature: z.enum(['FIXED', 'VARIABLE']).default('VARIABLE'),
  paymentStatus: z.string().optional(),
  nextDueDate: z.string().nullable().optional(),
  vatWithholdingAmount: z.coerce.number().optional(),
  islrWithholdingAmount: z.coerce.number().optional(),
  categoryName: z.string().optional(),
  approvedByUserId: z.string().uuid().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().nullable().optional(),
  paidByUserId: z.string().uuid().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const expenseFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  paymentSource: z.string().optional(),
  type: z.string().optional(),
  nature: z.string().optional(),
  status: z.string().optional(),
});

export type ExpenseFilters = z.infer<typeof expenseFilterSchema>;

export const expenseModeSchema = z.object({
  mode: z.enum(['AGILE', 'CORPORATE']),
  businessType: z.string(),
  hasAccounting: z.boolean(),
  activeModules: z.array(z.string()),
});

export type ExpenseMode = z.infer<typeof expenseModeSchema>;
