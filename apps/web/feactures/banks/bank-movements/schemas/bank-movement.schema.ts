import { z } from 'zod';
import { BANK_TRANSACTION_CATEGORY, PAYMENT_METHOD } from './bank-movement-options';

const paymentMethodEnum = z.enum(Object.keys(PAYMENT_METHOD) as [string, ...string[]]);
const bankTransactionCategoryEnum = z.enum(Object.keys(BANK_TRANSACTION_CATEGORY) as [string, ...string[]]);

export const bankMovementSchema = z.object({
  id: z.number().optional(),
  bankAccountId: z.number({ required_error: 'La cuenta bancaria es requerida.' }),
  transactionDate: z.date({ required_error: 'La fecha es requerida.' }),
  transactionType: paymentMethodEnum,
  description: z.string().min(1, 'La descripción es requerida.'),
  
  movementType: z.enum(['ENTRY', 'EXIT'], { required_error: 'El tipo de movimiento es requerido.' }),
  amount: z.number().min(0.01, 'El monto debe ser mayor a cero.'),

  bankReference: z.string().optional(),
  category: bankTransactionCategoryEnum.optional(),
});

export type BankMovement = z.infer<typeof bankMovementSchema>;