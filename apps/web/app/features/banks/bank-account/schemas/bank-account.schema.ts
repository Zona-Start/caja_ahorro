import { z } from 'zod';
import { ACCOUNT_TYPE, CURRENCY_CODE } from './bank-account-options';

export const bankAccountFormSchema = z.object({
  bankDirectoryId: z.coerce.number().min(1, 'El banco es requerido'),
  accountName: z
    .string()
    .min(1, 'El nombre de la cuenta es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  accountNumber: z
    .string()
    .min(1, 'El número de cuenta es requerido')
    .max(50, 'El número no puede superar 50 caracteres'),
  accountType: z.nativeEnum(ACCOUNT_TYPE, {
    errorMap: () => ({ message: 'El tipo de cuenta es requerido' }),
  }),
  currencyCode: z.nativeEnum(CURRENCY_CODE, {
    errorMap: () => ({ message: 'El código de moneda es requerido' }),
  }),
  openingDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha de apertura es requerida' }) }),
  currentBalance: z.coerce.number().min(0, 'El balance no puede ser negativo'),
  linkedChartAccountId: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BankAccountForm = z.infer<typeof bankAccountFormSchema>;

export const bankAccountSchema = bankAccountFormSchema.extend({
  id: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;
