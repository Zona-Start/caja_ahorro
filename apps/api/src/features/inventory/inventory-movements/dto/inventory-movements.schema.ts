import { z } from 'zod';

export const InventoryMovementItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive('La cantidad debe ser mayor a 0'),
  ),
  unitCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
});

export const CreateInventoryMovementSchema = z.object({
  movementType: z.enum(
    [
      'PURCHASE_RECEIPT',
      'SUPPLIER_RETURN',
      'STOCK_DELIVERY',
      'CUSTOMER_RETURN',
      'INTERNAL_TRANSFER_OUT',
      'INTERNAL_TRANSFER_IN',
      'INVENTORY_ADJUSTMENT_IN',
      'INVENTORY_ADJUSTMENT_OUT',
      'STOCK_WASTE',
      'INTERNAL_CONSUMPTION',
    ],
    { errorMap: () => ({ message: 'Tipo de movimiento inválido' }) },
  ),
  movementDate: z
    .string()
    .date()
    .or(z.string().datetime())
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional()
    .nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  associateId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  creditId: z.string().uuid().optional().nullable(),
  items: z
    .array(InventoryMovementItemSchema)
    .min(1, 'Debe agregar al menos un producto'),
});

export const UpdateInventoryMovementSchema =
  CreateInventoryMovementSchema.partial();

export type CreateInventoryMovementDto = z.infer<
  typeof CreateInventoryMovementSchema
>;
export type UpdateInventoryMovementDto = z.infer<
  typeof UpdateInventoryMovementSchema
>;
