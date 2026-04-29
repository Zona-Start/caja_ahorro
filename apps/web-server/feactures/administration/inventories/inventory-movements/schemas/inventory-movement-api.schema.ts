import { z } from 'zod';

// Schema for individual inventory movements as returned by the API (e.g., findAll)
export const inventoryMovementApiSchema = z.object({
  id: z.number().optional(),
  itemId: z.number(), // Changed from productId
  itemType: z.enum(['PRODUCT', 'FIXED_ASSET']), // Added itemType
  productName: z.string().optional().nullable(), // Optional for fixed assets
  fixedAssetName: z.string().optional().nullable(), // Optional for products
  description: z.string().optional().nullable(),
  movementType: z.string(),
  quantity: z.number(),
  unitCost: z.string().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  movementNumber: z.string().optional().nullable(),
  movementDate: z.string().optional().nullable(),
});

export type InventoryMovementSchemaAPI = z.infer<
  typeof inventoryMovementApiSchema
>;

// Schema for the response of the create (mutation) API call
// The create endpoint now returns an array of created movements
export const inventoryMovementMutationResponseSchema = z.object({
  message: z.string().optional(), // Message is optional now
  data: z.array(inventoryMovementApiSchema), // The API now returns an array of movements
});

// Schema for the response of the findAll API call
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
