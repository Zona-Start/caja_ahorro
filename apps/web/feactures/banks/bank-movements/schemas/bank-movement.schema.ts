import { z } from 'zod';
import { categoryKeys, paymentMethodKeys } from './bank-movement-options';

export const linkItemSchema = z.object({
  internalRecordType: z.string(),
  internalRecordId: z.number(),
});

export const bankMovementSchema = z.object({
  id: z.number().optional(),
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es requerida.',
  }),
  transactionDate: z.date({ required_error: 'La fecha es requerida.' }),
  paymentMethod: z.enum(paymentMethodKeys),
  description: z.string().min(1, 'La descripción es requerida.'),

  movementType: z.enum(['ENTRY', 'EXIT'], {
    required_error: 'El tipo de movimiento es requerido.',
  }),
  amount: z.number().min(0.01, 'El monto debe ser mayor a cero.'),

  bankReference: z.string().min(1, 'La refencia es requerida.'),
  category: z.enum(categoryKeys, {
    required_error: 'La categoría es requerida.',
  }),
  links: z.array(linkItemSchema).optional(),
});

export type BankMovement = z.infer<typeof bankMovementSchema>;
