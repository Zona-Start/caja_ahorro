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
  commercialHouseId: z.string().optional().nullable(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
      }),
    )
    .optional(),
    items: z
    .array(
      z.object({
        description: z.string().min(1, 'La descripción es requerida'),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
        cost: z.number().min(0, 'El costo no puede ser negativo'),
        days: z.string().optional(),
      }),
    )
    .optional(),
});

export type Withdrawal = z.infer<typeof withdrawalSchema>;
