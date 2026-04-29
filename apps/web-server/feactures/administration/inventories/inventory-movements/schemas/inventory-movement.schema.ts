import { z } from 'zod';

// New schema for individual items within a movement
export const inventoryMovementItemSchema = z.object({
  itemId: z.number({ required_error: 'El ID del item es requerido' }),
  itemType: z.enum(['PRODUCT', 'FIXED_ASSET'], {
    required_error: 'El tipo de item es requerido',
  }),
  itemName: z.string().optional().nullable(),
  quantity: z.coerce
    .number({ required_error: 'La cantidad es requerida' })
    .int()
    .min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().optional().nullable(),
  previousStock: z.coerce.number().optional().nullable(),
  newStock: z.coerce.number().optional().nullable(),
});

export type InventoryMovementItem = z.infer<typeof inventoryMovementItemSchema>;

// Main schema for creating inventory movements (batch)
export const createInventoryMovementSchema = z.object({
  movementType: z.string({
    required_error: 'El tipo de movimiento es requerido',
  }),
  description: z.string().max(255, 'La descripción debe tener como máximo 255 caracteres').optional().nullable(), // New field
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z
    .array(inventoryMovementItemSchema)
    .min(1, 'Debe haber al menos un item en el movimiento'),
});

export type CreateInventoryMovement = z.infer<
  typeof createInventoryMovementSchema
>;

// Schema for displaying individual inventory movements (from API response)
// This will be used for the table display, as the API still returns individual movements
export const inventoryMovementSchema = z.object({
  id: z.number().nullable().optional(),
  itemId: z.number(), // This will be the actual item ID from the DB
  itemType: z.enum(['PRODUCT', 'FIXED_ASSET']),
  movementType: z.string(),
  description: z.string().optional().nullable(), // Added to display schema as well
  quantity: z.number(),
  unitCost: z.number().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // New fields from API enrichment
  productName: z.string().optional().nullable(),
  fixedAssetName: z.string().optional().nullable(),
  fixedAssetCode: z.string().optional().nullable(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
