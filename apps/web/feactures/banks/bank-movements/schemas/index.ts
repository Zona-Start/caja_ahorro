
import { z } from 'zod';
import { bankTransactionCategory, paymentMethodEnum } from '@/database/schema/enum';

export const bankMovementSchema = z.object({
  bankAccountId: z.coerce.number().int().positive({ message: 'La cuenta bancaria es requerida.' }),
  transactionDate: z.date({ required_error: 'La fecha es requerida.' }),
  paymentMethod: z.enum(paymentMethodEnum.enumValues, { required_error: 'El método de pago es requerido.' }),
  category: z.enum(bankTransactionCategory.enumValues, { required_error: 'La categoría es requerida.' }),
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
