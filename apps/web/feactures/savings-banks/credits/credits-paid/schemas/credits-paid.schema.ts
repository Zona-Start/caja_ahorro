import { z } from 'zod';
import {
  creditPaymentTypeEnum,
  paymentMethodEnum,
} from './credits-paid-options';

// Esquema de validación para el registro de pagos
export const creditPaymentSchema = z.object({
  id: z.number().optional(), // Puede ser opcional al crear
  creditId: z.number(),
  creditPaidId: z.number().optional(),
  paymentDate: z.date(), // ISO string
  paymentType: creditPaymentTypeEnum,
  amount: z.string().min(1, { message: 'Monto requerido' }), // monto cuota
  bankId: z.number().min(1, { message: 'Debe seleccionar un banco' }), // ID del banco
  paymentMethod: paymentMethodEnum,
  transactionReference: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

export type CreditPaid = z.infer<typeof creditPaymentSchema>;
