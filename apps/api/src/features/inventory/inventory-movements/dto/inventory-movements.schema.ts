import { z } from 'zod';

export const InventoryMovementItemSchema = z.object({
  productId: z.string().uuid('Product ID inválido'),
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive(),
  ),
  unitCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
});

export const CreateInventoryMovementSchema = z.object({
  movementType: z.enum(['PURCHASE_RECEIPT', 'SUPPLIER_RETURN', 'STOCK_DELIVERY', 'CUSTOMER_RETURN', 'INTERNAL_TRANSFER_OUT', 'INTERNAL_TRANSFER_IN', 'INVENTORY_ADJUSTMENT_IN', 'INVENTORY_ADJUSTMENT_OUT', 'STOCK_WASTE', 'INTERNAL_CONSUMPTION', 'PRODUCTION_CONSUMPTION', 'PRODUCTION_OUTPUT']),
  description: z.string().max(255).optional(),
  items: z.array(InventoryMovementItemSchema).min(1, 'Se requiere al menos un item'),
});

export const UpdateInventoryMovementSchema = CreateInventoryMovementSchema.partial();

export type CreateInventoryMovementDto = z.infer<typeof CreateInventoryMovementSchema>;
export type UpdateInventoryMovementDto = z.infer<typeof UpdateInventoryMovementSchema>;
