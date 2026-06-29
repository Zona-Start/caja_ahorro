import { z } from 'zod';
import { ACCOUNT_TYPE, CURRENCY_CODE } from './bank-account-options';

export const bankAccountFormSchema = z.object({
  bankDirectoryId: z.string().uuid('El banco es requerido'),
  accountName: z
    .string()
    .min(1, 'El nombre de la cuenta es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  accountNumber: z
    .string()
    .regex(/^\d{20}$/, 'El número de cuenta debe tener exactamente 20 dígitos'),
  accountType: z.nativeEnum(ACCOUNT_TYPE, {
    errorMap: () => ({ message: 'El tipo de cuenta es requerido' }),
  }),
  currencyCode: z.nativeEnum(CURRENCY_CODE, {
    errorMap: () => ({ message: 'El código de moneda es requerido' }),
  }),
  openingDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de apertura es requerida' }),
  }),
  currentBalance: z.coerce.number().min(0, 'El balance no puede ser negativo').optional(),
  linkedChartAccountId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BankAccountForm = z.infer<typeof bankAccountFormSchema>;

export const bankAccountSchema = bankAccountFormSchema.extend({
  id: z.string().uuid(),
  bankDirectoryName: z.string().optional(),
  lastStatementBalance: z.number().optional().nullable(),
  lastStatementDate: z.string().optional().nullable(),
  openingEntryPosted: z.boolean().optional(),
  ruleAccountId: z.string().uuid().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;
