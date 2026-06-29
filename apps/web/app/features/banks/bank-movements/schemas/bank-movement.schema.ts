import { z } from 'zod';
import { PAYMENT_METHOD, CATEGORY } from './bank-movement-options';

export const bankMovementFormSchema = z.object({
  bankAccountId: z.string().uuid('La cuenta bancaria es requerida'),
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de transacción es requerida' }),
  }),
  paymentMethod: z.nativeEnum(PAYMENT_METHOD, {
    errorMap: () => ({ message: 'El método de pago es requerido' }),
  }),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  category: z.nativeEnum(CATEGORY).optional(),
  creditAmount: z.coerce.number().min(0).optional(),
  debitAmount: z.coerce.number().min(0).optional(),
  bankReference: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  valueDate: z.coerce.date().optional(),
  note: z.string().max(500).optional().nullable(),
});

export type BankMovementForm = z.infer<typeof bankMovementFormSchema>;

export const bankMovementSchema = bankMovementFormSchema.extend({
  id: z.string().uuid(),
  internalCode: z.string().optional(),
  bankAccountName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional(),
  bankCurrencyCode: z.string().optional(),
  reconciliationStatus: z.string().optional(),
  internalLinkStatus: z.string().optional(),
  resultingBalance: z.number().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankMovement = z.infer<typeof bankMovementSchema>;
