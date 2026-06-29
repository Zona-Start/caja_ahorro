import { z } from 'zod';

export const movementItemApiSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  productName: z.string().optional().nullable(),
  productCode: z.string().optional().nullable(),
  quantity: z.number(),
  unitCost: z.number().optional().nullable(),
  totalCost: z.number().optional().nullable(),
});

export const inventoryMovementApiSchema = z.object({
  id: z.string(),
  movementNumber: z.string().optional().nullable(),
  movementType: z.string(),
  movementDate: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  associateId: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  items: z.array(movementItemApiSchema).optional().default([]),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type InventoryMovementApi = z.infer<typeof inventoryMovementApiSchema>;

export const inventoryMovementMetaSchema = z.object({
  totalCount: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
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
