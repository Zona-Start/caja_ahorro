import { z } from 'zod';
import { creditPaymentTypeEnum, paymentMethodEnum } from './credits-paid-options';

export const creditPaymentSchema = z.object({
  creditId: z.string().uuid({
    message: 'El crédito es requerido',
  }),
  paymentDate: z.coerce.date({
    required_error: 'La fecha de pago es requerida',
  }),
  paymentType: creditPaymentTypeEnum.default('PAYING'),
  amount: z.coerce.number().positive({
    message: 'El monto debe ser mayor a 0',
  }),
  bankId: z.string().uuid().optional().nullable(),
  paymentMethod: paymentMethodEnum.default('CASH'),
  transactionReference: z.string().optional(),
  comment: z.string().optional(),
});

export type CreditPayment = z.infer<typeof creditPaymentSchema>;

export const creditPaymentFormSchema = z.object({
  creditId: z.string().uuid({
    message: 'El crédito es requerido',
  }),
  paymentDate: z.date({
    required_error: 'La fecha de pago es requerida',
  }),
  paymentType: creditPaymentTypeEnum.default('PAYING'),
  amount: z.string().min(1, {
    message: 'El monto es requerido',
  }),
  bankId: z.string().uuid().optional().nullable(),
  paymentMethod: paymentMethodEnum.default('CASH'),
  transactionReference: z.string().optional(),
  comment: z.string().optional(),
});

export type CreditPaymentFormValues = z.infer<typeof creditPaymentFormSchema>;
