import { z } from 'zod';
import { DOCUMENT_TYPE, ITEM_TYPE, MOVEMENT_TYPE } from './movements-options';

export const movementItemSchema = z.object({
  id: z.number(),
  itemId: z.number(),
  itemType: z.enum(Object.keys(ITEM_TYPE) as [string, ...string[]]),
  itemName: z.string(),
  quantity: z.number(),
  unitPrice: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
});

export type MovementItem = z.infer<typeof movementItemSchema>;

export const inventoryMovementSchema = z.object({
  id: z.number(),
  movementType: z.enum(Object.keys(MOVEMENT_TYPE) as [string, ...string[]]),
  documentType: z.enum(Object.keys(DOCUMENT_TYPE) as [string, ...string[]]),
  documentNumber: z.string(),
  description: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(movementItemSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;

export const inventoryMovementFormSchema = z.object({
  movementType: z.enum(Object.keys(MOVEMENT_TYPE) as [string, ...string[]], {
    errorMap: () => ({ message: 'El tipo de movimiento es requerido' }),
  }),
  documentType: z.enum(Object.keys(DOCUMENT_TYPE) as [string, ...string[]], {
    errorMap: () => ({ message: 'El tipo de documento es requerido' }),
  }),
  documentNumber: z
    .string()
    .min(1, 'El número de documento es requerido')
    .max(100, 'El número de documento no puede superar 100 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  notes: z
    .string()
    .max(500, 'La nota no puede superar 500 caracteres')
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        itemId: z.coerce.number().min(1, 'El ítem es requerido'),
        itemType: z.enum(Object.keys(ITEM_TYPE) as [string, ...string[]]),
        quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
        unitPrice: z.coerce.number().min(0).optional().nullable(),
      }),
    )
    .min(1, 'Debe agregar al menos un ítem'),
});

export type InventoryMovementForm = z.infer<typeof inventoryMovementFormSchema>;

export const stockResponseSchema = z.object({
  itemId: z.number(),
  itemType: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  committed: z.number(),
  ordered: z.number(),
  available: z.number(),
  unit: z.string().optional().nullable(),
});

export type StockResponse = z.infer<typeof stockResponseSchema>;
