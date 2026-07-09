import { z } from 'zod';
import { loanPaymentTypeEnum, paymentMethodEnum } from './loans-paid-options';

export const loanPaymentSchema = z.object({
  loanId: z.string().uuid({
    message: 'El préstamo es requerido',
  }),
  paymentDate: z.coerce.date({
    required_error: 'La fecha de pago es requerida',
  }),
  paymentType: loanPaymentTypeEnum.default('PAYING'),
  amount: z.coerce.number().positive({
    message: 'El monto debe ser mayor a 0',
  }),
  bankId: z.string().uuid().optional().nullable(),
  paymentMethod: paymentMethodEnum.default('CASH'),
  transactionReference: z.string().optional(),
  comment: z.string().optional(),
});

export type LoanPayment = z.infer<typeof loanPaymentSchema>;
