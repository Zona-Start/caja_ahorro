import { z } from 'zod';
import { PaymentMethodEnum } from '../../supplier-payments/schemas/supplier-payment-options';

export const advancePaymentSchema = z.object({
  supplierId: z.number({
    required_error: 'El proveedor es obligatorio.',
  }),
  amount: z.coerce.number().positive('El monto a pagar debe ser mayor a cero.'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  bankReference: z.string().optional().nullable(),
  paymentDescription: z.string().min(1, 'La descripción es obligatoria.'),
  transactionDate: z.date(),
});

export type AdvancePayment = z.infer<typeof advancePaymentSchema>;
