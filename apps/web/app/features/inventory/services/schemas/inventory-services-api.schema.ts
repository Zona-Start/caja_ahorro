import { z } from 'zod';
import { InventoryServiceStatus } from './inventory-services-options';

export const inventoryServiceApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  categoryId: z.string(),
  supplierCost: z.number(),
  otherCosts: z.number(),
  purchaseTax: z.number(),
  status: z.nativeEnum(InventoryServiceStatus),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type InventoryServiceApi = z.infer<typeof inventoryServiceApiSchema>;

export const paginatedMetaSchema = z.object({
  totalItems: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export const inventoryServiceResponseSchema = z.object({
  message: z.string(),
  data: inventoryServiceApiSchema,
});

export const inventoryServiceListResponseSchema = z.object({
  message: z.string(),
  data: z.array(inventoryServiceApiSchema),
});

export const inventoryServicePaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(inventoryServiceApiSchema),
  meta: paginatedMetaSchema,
});

export const inventoryServiceDeleteResponseSchema = z.object({
  message: z.string(),
});
