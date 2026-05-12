import { z } from 'zod';
import { PAYMENT_METHOD, CATEGORY } from './bank-movement-options';

export const bankMovementFormSchema = z.object({
  bankAccountId: z.coerce.number().min(1, 'La cuenta bancaria es requerida'),
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de transacción es requerida' }),
  }),
  paymentMethod: z.enum(
    Object.keys(PAYMENT_METHOD) as [string, ...string[]],
    { errorMap: () => ({ message: 'El método de pago es requerido' }) },
  ),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  category: z.enum(Object.keys(CATEGORY) as [string, ...string[]], {
    errorMap: () => ({ message: 'La categoría es requerida' }),
  }),
  creditAmount: z.coerce.number().min(0, 'El monto no puede ser negativo').optional(),
  debitAmount: z.coerce.number().min(0, 'El monto no puede ser negativo').optional(),
  bankReference: z
    .string()
    .max(100, 'La referencia no puede superar 100 caracteres')
    .optional()
    .nullable(),
  note: z
    .string()
    .max(500, 'La nota no puede superar 500 caracteres')
    .optional()
    .nullable(),
});

export type BankMovementForm = z.infer<typeof bankMovementFormSchema>;

export const bankMovementSchema = bankMovementFormSchema.extend({
  id: z.number(),
  bankAccount: z
    .object({
      id: z.number(),
      accountName: z.string(),
      accountNumber: z.string(),
    })
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankMovement = z.infer<typeof bankMovementSchema>;
