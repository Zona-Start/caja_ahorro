import { z } from 'zod';
import { loanPaymentTypeEnum, paymentMethodEnum } from './loans-paid-options';

// Esquema de validación para el registro de pagos
export const loanPaymentSchema = z.object({
  id: z.number().optional(), // Puede ser opcional al crear
  loanId: z.number(),
  loanPaidId: z.number().optional(),
  paymentDate: z.date(), // ISO string
  paymentType: loanPaymentTypeEnum,
  amount: z.string().min(1, { message: 'Monto requerido' }), // monto cuota
  bankId: z.number().min(1, { message: 'Debe seleccionar un banco' }), // ID del banco
  paymentMethod: paymentMethodEnum,
  transactionReference: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

export type LoanPaid = z.infer<typeof loanPaymentSchema>;
