import { z } from 'zod';
import {
  BANK_TRANSACTION_CATEGORY,
  PAYMENT_METHOD,
} from './bank-movement-options';

const PaymentMethodTuple = [
  Object.values(PAYMENT_METHOD)[0],
  ...Object.values(PAYMENT_METHOD).slice(1),
] as [string, ...string[]];
const CategoryTuple = [
  Object.values(BANK_TRANSACTION_CATEGORY)[0],
  ...Object.values(BANK_TRANSACTION_CATEGORY).slice(1),
] as [string, ...string[]];

export const bankMovementSchema = z.object({
  bankAccountId: z.coerce
    .number()
    .int()
    .positive({ message: 'La cuenta bancaria es requerida.' }),
  transactionDate: z.date({ required_error: 'La fecha es requerida.' }),
  paymentMethod: z.enum(PaymentMethodTuple, {
    required_error: 'El método de pago es requerido.',
  }),
  category: z.enum(CategoryTuple, {
    required_error: 'La categoría es requerida.',
  }),
  description: z.string().min(1, { message: 'La descripción es requerida.' }),
  bankReference: z.string().optional(),
  debitAmount: z.coerce.number().min(0).optional(),
  creditAmount: z.coerce.number().min(0).optional(),
});

export const linkItemSchema = z.object({
  internalRecordType: z.string(),
  internalRecordId: z.number(),
});

export const createAndReconcileSchema = z.object({
  movement: bankMovementSchema,
  link: linkItemSchema.optional(),
});

export type BankMovementSchema = z.infer<typeof bankMovementSchema>;
export type LinkItemSchema = z.infer<typeof linkItemSchema>;
export type CreateAndReconcileSchema = z.infer<typeof createAndReconcileSchema>;
