import { z } from 'zod';
import { creditPaymentTypeEnum, paymentMethodEnum } from './credits-paid-options';

export const creditPaymentSchema = z.object({
  id: z.number().optional(),
  creditId: z.number({
    required_error: 'El crédito es requerido',
  }),
  creditPaidId: z.string().optional(),
  paymentDate: z.date({
    required_error: 'La fecha de pago es requerida',
  }),
  paymentType: creditPaymentTypeEnum.default('REGULAR'),
  amount: z.string().min(1, {
    message: 'El monto es requerido',
  }),
  bankId: z.number().optional().nullable(),
  paymentMethod: paymentMethodEnum.default('CASH'),
  transactionReference: z.string().optional(),
  comment: z.string().optional(),
});

export type CreditPayment = z.infer<typeof creditPaymentSchema>;
