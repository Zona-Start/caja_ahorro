import { z } from 'zod';

export const movementItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Debe seleccionar un producto'),
  purchaseOrderItemId: z.string().optional(),
  productName: z.string().optional(),
  productCode: z.string().optional(),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.coerce.number().min(0, 'El costo no puede ser negativo').default(0),
  totalCost: z.coerce.number().min(0).default(0),
});

export type MovementItem = z.infer<typeof movementItemSchema>;

export const inventoryMovementSchema = z.object({
  id: z.string().optional(),
  movementNumber: z.string().optional(),
  movementType: z.string().min(1, 'El tipo de movimiento es requerido'),
  movementDate: z.coerce.date(),
  status: z.string().optional(),
  description: z.string().max(500).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  associateId: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  items: z.array(movementItemSchema).min(1, 'Debe agregar al menos un producto'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
