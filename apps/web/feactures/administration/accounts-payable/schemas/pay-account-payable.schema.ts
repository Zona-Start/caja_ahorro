import { z } from 'zod';
import { PaymentMethodEnum } from '../../supplier-payments/schemas/supplier-payment-options';

export const payAccountPayableSchema = z.object({
  // FKs and identifiers
  supplierId: z.number(),
  accountsPayableId: z.number(),

  // Form fields
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  paymentDescription: z.string().min(1, 'La descripción es obligatoria.'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  amount: z.coerce.number().positive('El monto a pagar debe ser mayor a cero.'),
});

export type PayAccountPayable = z.infer<typeof payAccountPayableSchema>;
