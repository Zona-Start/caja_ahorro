import { z } from 'zod';

export const inventoryMovementSchema = z.object({
  id: z.number().nullable().optional(),
  productId: z.number({ required_error: 'El producto es requerido' }),
  movementType: z.string({ required_error: 'El tipo de movimiento es requerido' }),
  quantity: z.coerce.number({ required_error: 'La cantidad es requerida' }).int().min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
