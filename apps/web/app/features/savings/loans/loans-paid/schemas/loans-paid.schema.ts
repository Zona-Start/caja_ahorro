import { z } from 'zod';
import { paymentMethodEnum, paymentTypeEnum } from './loans-paid-options';

export const loanPaymentSchema = z.object({
  id: z.number().optional(),
  creditId: z.number({ required_error: 'El crédito es requerido' }),
  paymentDate: z.coerce.date({ required_error: 'La fecha de pago es requerida' }),
  paymentType: paymentTypeEnum,
  amount: z.string().min(1, { message: 'El monto es requerido' }),
  bankId: z.number({ required_error: 'El banco es requerido' }),
  paymentMethod: paymentMethodEnum,
  transactionReference: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export type LoanPayment = z.infer<typeof loanPaymentSchema>;
