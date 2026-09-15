import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExpenseReportItemSchema = z.object({
  categoryId: z.string().uuid('La categoría del item es requerida'),
  description: z.string().min(1, 'La descripción del item es requerida'),
  amount: z.coerce.number().positive('El monto del item debe ser mayor a cero'),
  receiptImageUrl: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
  expenseDate: z.string().optional(),
});

export const CreateExpenseReportSchema = z.object({
  employeeUserId: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, 'El título del reporte es requerido')
    .max(255, 'Máximo 255 caracteres'),
  description: z.string().max(500).optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  items: z
    .array(ExpenseReportItemSchema)
    .min(1, 'Agrega al menos un ticket/item al reporte'),
});
export class CreateExpenseReportDto extends createZodDto(
  CreateExpenseReportSchema,
) {}

export const UpdateExpenseReportSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(500).optional(),
    items: z.array(ExpenseReportItemSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No hay cambios para aplicar',
  });
export class UpdateExpenseReportDto extends createZodDto(
  UpdateExpenseReportSchema,
) {}

export const RejectExpenseReportSchema = z.object({
  reason: z.string().max(500).optional(),
});
export class RejectExpenseReportDto extends createZodDto(
  RejectExpenseReportSchema,
) {}

export const PayExpenseReportSchema = z
  .object({
    paymentSource: z.enum(['BANK_ACCOUNT', 'PETTY_CASH']),
    bankAccountId: z.string().uuid().optional(),
    pettyCashFundId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentSource === 'BANK_ACCOUNT' && !data.bankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la cuenta bancaria para el pago',
        path: ['bankAccountId'],
      });
    }
    if (data.paymentSource === 'PETTY_CASH' && !data.pettyCashFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el fondo fijo para el pago',
        path: ['pettyCashFundId'],
      });
    }
  });
export class PayExpenseReportDto extends createZodDto(PayExpenseReportSchema) {}

export const FilterExpenseReportSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  employeeUserId: z.string().uuid().optional(),
  search: z.string().optional(),
});
export class FilterExpenseReportDto extends createZodDto(
  FilterExpenseReportSchema,
) {}
