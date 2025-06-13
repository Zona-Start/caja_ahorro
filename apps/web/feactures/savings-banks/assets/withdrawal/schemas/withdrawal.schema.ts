import { z } from 'zod';
import { paymentMethodEnum } from './withdrawal-options';

// Esquema de validación para el registro de pagos
export const withdrawalSchema = z.object({
  id: z.number().optional(), // Puede ser opcional al crear
  associateAccountId: z.number(),
  withdrawalTypeId: z.number().optional(),
  withdrawalDate: z.date(), // ISO string
  requestedAmount: z.string().min(1, { message: 'Monto requerido' }), // monto cuota
  paymentMethod: paymentMethodEnum,
});

export type Withdrawal = z.infer<typeof withdrawalSchema>;
