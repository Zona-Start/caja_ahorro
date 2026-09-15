import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RecurringExpenseTemplateBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la plantilla es requerido')
    .max(255, 'Máximo 255 caracteres'),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('La categoría de gasto es requerida'),
  supplierId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  paymentSource: z
    .enum(['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH'])
    .default('BANK_ACCOUNT'),
  bankAccountId: z.string().uuid().optional(),
  pettyCashFundId: z.string().uuid().optional(),
  frequency: z
    .enum(['MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL'])
    .default('MONTHLY'),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  autoCreate: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const CreateRecurringExpenseTemplateSchema =
  RecurringExpenseTemplateBaseSchema.superRefine((data, ctx) => {
    if (data.paymentSource === 'BANK_ACCOUNT' && data.bankAccountId) return;
    if (data.paymentSource === 'PETTY_CASH' && data.pettyCashFundId) return;
    // CASH_REGISTER no es ideal para recurrentes, pero se permite sin validar
    if (data.paymentSource === 'CASH_REGISTER') return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Selecciona la cuenta bancaria o el fondo fijo según la fuente de pago',
      path: ['paymentSource'],
    });
  });
export class CreateRecurringExpenseTemplateDto extends createZodDto(
  CreateRecurringExpenseTemplateSchema,
) {}

export const UpdateRecurringExpenseTemplateSchema =
  RecurringExpenseTemplateBaseSchema.partial();
export class UpdateRecurringExpenseTemplateDto extends createZodDto(
  UpdateRecurringExpenseTemplateSchema,
) {}

export const FilterRecurringExpenseTemplateSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
export class FilterRecurringExpenseTemplateDto extends createZodDto(
  FilterRecurringExpenseTemplateSchema,
) {}
