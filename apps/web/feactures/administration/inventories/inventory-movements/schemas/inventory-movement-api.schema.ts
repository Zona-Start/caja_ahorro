import { z } from 'zod';

export const inventoryMovementApiSchema = z.object({
  id: z.number().optional(),
  productId: z.number(),
  movementType: z.string(),
  quantity: z.number(),
  unitCost: z.number().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InventoryMovementSchemaAPI = z.infer<typeof inventoryMovementApiSchema>;

export const inventoryMovementMutationResponseSchema = z.object({
  message: z.string(),
});

export const inventoryMovementAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryMovementApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});
