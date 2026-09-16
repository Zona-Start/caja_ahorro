import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExpenseDetailSchema = z.object({
  categoryId: z.string().uuid('La categoría de la línea es requerida'),
  description: z.string().min(1, 'La descripción de la línea es requerida'),
  amount: z.coerce
    .number()
    .positive('El monto de la línea debe ser mayor a cero'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  isExempt: z.boolean().optional().default(false),
});

export const CreateExpenseSchema = z
  .object({
    categoryId: z.string().uuid('La categoría de gasto es requerida'),
    paymentSource: z.enum(['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH']),
    amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
    description: z.string().min(1, 'La descripción es requerida'),
    currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
    exchangeRate: z.coerce.number().positive().default(1),
    taxAmountBase: z.coerce.number().min(0).optional().default(0),

    // Líneas de detalle del gasto (varios conceptos)
    details: z.array(ExpenseDetailSchema).optional(),

    // Campos del modo corporativo
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
    frequency: z
      .enum(['MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL'])
      .optional(),

    // Fuente de financiamiento (según paymentSource)
    cashRegisterSessionId: z.string().uuid().optional(),
    bankAccountId: z.string().uuid().optional(),
    pettyCashFundId: z.string().uuid().optional(),

    // Permite saltar el control de presupuesto (si el rol tiene permiso)
    overrideBudget: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.paymentSource === 'CASH_REGISTER' && !data.cashRegisterSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La sesión de caja es requerida cuando la fuente es CASH_REGISTER',
        path: ['cashRegisterSessionId'],
      });
    }
    if (data.paymentSource === 'BANK_ACCOUNT' && !data.bankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La cuenta bancaria es requerida cuando la fuente es BANK_ACCOUNT',
        path: ['bankAccountId'],
      });
    }
    if (data.paymentSource === 'PETTY_CASH' && !data.pettyCashFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El fondo fijo es requerido cuando la fuente es PETTY_CASH',
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

export class CreateExpenseDto extends createZodDto(CreateExpenseSchema) {}

export const FilterExpenseSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  paymentSource: z
    .enum(['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH'])
    .optional(),
  type: z.enum(['EXPRESS', 'FORMAL_INVOICE']).optional(),
  nature: z.enum(['FIXED', 'VARIABLE']).optional(),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED'])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export class FilterExpenseDto extends createZodDto(FilterExpenseSchema) {}
