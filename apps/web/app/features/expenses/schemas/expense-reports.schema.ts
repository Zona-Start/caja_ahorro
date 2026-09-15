import { z } from 'zod';

export const REPORT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PAID: 'Pagado',
} as const;

export const reportItemFormSchema = z.object({
  categoryId: z.string().uuid('La categoría es requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  amount: z.coerce.number().positive('Monto mayor a cero'),
  receiptImageUrl: z.string().url('URL válida').optional().or(z.literal('')),
  expenseDate: z.string().optional(),
});

export type ReportItemForm = z.infer<typeof reportItemFormSchema>;

export const reportFormSchema = z.object({
  employeeUserId: z.string().optional().or(z.literal('')),
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(255, 'Máximo 255 caracteres'),
  description: z.string().max(500).optional().or(z.literal('')),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  items: z.array(reportItemFormSchema).min(1, 'Agrega al menos un ticket/item'),
});

export type ExpenseReportForm = z.infer<typeof reportFormSchema>;

export const payReportFormSchema = z
  .object({
    paymentSource: z.enum(['BANK_ACCOUNT', 'PETTY_CASH']),
    bankAccountId: z.string().optional().or(z.literal('')),
    pettyCashFundId: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.paymentSource === 'BANK_ACCOUNT' && !data.bankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la cuenta bancaria',
        path: ['bankAccountId'],
      });
    }
    if (data.paymentSource === 'PETTY_CASH' && !data.pettyCashFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el fondo fijo',
        path: ['pettyCashFundId'],
      });
    }
  });

export type PayReportForm = z.infer<typeof payReportFormSchema>;

export const expenseReportSchema = z.object({
  id: z.string().uuid(),
  employeeUserId: z.string(),
  employeeName: z.string().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  totalAmount: z.number(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  paymentSource: z
    .enum(['BANK_ACCOUNT', 'CASH_REGISTER', 'PETTY_CASH'])
    .nullable()
    .optional(),
  paidExpenseId: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type ExpenseReport = z.infer<typeof expenseReportSchema>;

export const reportItemSchema = reportItemFormSchema.extend({
  id: z.string().uuid(),
  expenseDate: z.string().optional(),
});

export type ExpenseReportItem = z.infer<typeof reportItemSchema>;
