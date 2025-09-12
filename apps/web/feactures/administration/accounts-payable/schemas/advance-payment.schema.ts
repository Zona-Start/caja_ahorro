import { z } from 'zod';

//schema para formulario de anticipos cxp
export const advancePaymentSchema = z.object({
  supplierId: z.number({
    required_error: 'El proveedor es obligatorio.',
  }),
  amount: z.coerce
    .number()
    .positive('El monto del anticipo debe ser mayor a cero.'),
  observations: z.string().min(1, 'Los detalles son obligatorios.'),
});

export type AdvancePayment = z.infer<typeof advancePaymentSchema>;
