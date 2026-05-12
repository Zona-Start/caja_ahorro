import { z } from 'zod';

export const movementItemApiSchema = z.object({
  id: z.number(),
  itemId: z.number(),
  itemType: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  unitPrice: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
});

export const inventoryMovementApiSchema = z.object({
  id: z.number(),
  movementType: z.string(),
  documentType: z.string(),
  documentNumber: z.string(),
  description: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(movementItemApiSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InventoryMovementApi = z.infer<typeof inventoryMovementApiSchema>;

export const inventoryMovementMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean().optional().nullable(),
  hasPreviousPage: z.boolean().optional().nullable(),
  nextPage: z.number().optional().nullable(),
  previousPage: z.number().optional().nullable(),
});

export const inventoryMovementListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryMovementApiSchema),
  meta: inventoryMovementMetaSchema,
});

export const inventoryMovementResponseSchema = z.object({
  message: z.string().optional(),
  data: inventoryMovementApiSchema,
});

export type InventoryMovementMeta = z.infer<
  typeof inventoryMovementMetaSchema
>;
export type InventoryMovementListResponse = z.infer<
  typeof inventoryMovementListResponseSchema
>;

export const stockApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    itemId: z.number(),
    itemType: z.string(),
    itemName: z.string(),
    quantity: z.number(),
    committed: z.number(),
    ordered: z.number(),
    available: z.number(),
    unit: z.string().optional().nullable(),
  }),
});
