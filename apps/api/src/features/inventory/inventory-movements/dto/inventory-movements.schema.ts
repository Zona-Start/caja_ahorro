import { z } from 'zod';

export const InventoryMovementItemSchema = z.object({
  itemId: z.string().uuid('Item ID inválido'),
  itemType: z.enum(['PRODUCT', 'FIXED_ASSET']),
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
  movementType: z.enum(['IN', 'OUT', 'ADJUST_IN', 'ADJUST_OUT', 'TRANSFER', 'COMMIT', 'UN_COMMIT', 'ORDERED', 'RECEIVED']),
  description: z.string().max(255).optional(),
  documentType: z.string().max(50).optional(),
  documentNumber: z.string().max(50).optional(),
  notes: z.string().optional(),
  supplierInvoiceId: z.string().uuid().optional(),
  items: z.array(InventoryMovementItemSchema).min(1, 'Se requiere al menos un item'),
});

export const UpdateInventoryMovementSchema = CreateInventoryMovementSchema.partial();

export type CreateInventoryMovementDto = z.infer<typeof CreateInventoryMovementSchema>;
export type UpdateInventoryMovementDto = z.infer<typeof UpdateInventoryMovementSchema>;
