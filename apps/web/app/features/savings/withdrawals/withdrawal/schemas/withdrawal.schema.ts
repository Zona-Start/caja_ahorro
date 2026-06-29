import { z } from 'zod';
import { paymentMethodEnum } from './withdrawal-options';

export const withdrawalSchema = z.object({
  associateAccountId: z.string().min(1, 'La cuenta del asociado es requerida'),
  withdrawalTypeId: z.string().min(1, 'Seleccione un tipo de retiro'),
  requestedAmount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: paymentMethodEnum,
  date: z.coerce.date(),
  description: z.string().optional(),
  commercialHouseId: z.string().optional().nullable(),
  withdrawalItems: z
    .array(
      z.object({
        itemType: z.enum(['PRODUCT', 'SERVICE', 'EXTERNAL']),
        itemDescription: z.string().optional().nullable(),
        itemId: z.string().optional().nullable(),
        itemName: z.string().optional().nullable(),
        quantity: z.number().positive('La cantidad debe ser al menos 1'),
        agreedSellingPrice: z.number().min(0, 'El precio no puede ser negativo'),
        days: z.string().optional().nullable(),
        specialDayCategoryId: z.string().optional(),
      }),
    )
    .optional(),
});

export type Withdrawal = z.infer<typeof withdrawalSchema>;
