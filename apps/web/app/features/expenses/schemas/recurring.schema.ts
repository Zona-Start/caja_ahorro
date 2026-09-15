import { z } from 'zod';

export const FREQUENCY_OPTIONS = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
} as const;

export const recurringFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(255, 'Máximo 255 caracteres'),
  description: z.string().max(500).optional().or(z.literal('')),
  categoryId: z.string().uuid('La categoría es requerida'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  paymentSource: z
    .enum(['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH'])
    .default('BANK_ACCOUNT'),
  bankAccountId: z.string().uuid().optional().or(z.literal('')),
  pettyCashFundId: z.string().uuid().optional().or(z.literal('')),
  frequency: z
    .enum(['MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL'])
    .default('MONTHLY'),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  autoCreate: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type RecurringForm = z.infer<typeof recurringFormSchema>;

export const recurringSchema = recurringFormSchema.extend({
  id: z.string().uuid(),
  dayOfMonth: z.number().nullable().optional(),
  nextRunDate: z.string().nullable().optional(),
  lastRunAt: z.string().nullable().optional(),
});

export type RecurringTemplate = z.infer<typeof recurringSchema>;
