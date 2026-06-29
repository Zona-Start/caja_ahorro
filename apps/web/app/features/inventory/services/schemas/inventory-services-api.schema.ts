import { z } from 'zod';
import { InventoryServiceStatus } from './inventory-services-options';

export const inventoryServiceApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  internalCode: z.string().optional(),
  categoryId: z.string(),
  categoryName: z.string().optional(),
  serviceType: z.string().optional().nullable(),
  currencyCode: z.string().optional().nullable().default('VES'),
  purchaseExchangeRate: z.union([z.number(), z.string()]).optional().nullable().default(1),
  supplierCost: z.union([z.number(), z.string()]).optional().default(0),
  otherCosts: z.union([z.number(), z.string()]).optional().default(0),
  purchaseTax: z.union([z.number(), z.string()]).optional().default(0),
  status: z.nativeEnum(InventoryServiceStatus),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type InventoryServiceApi = z.infer<typeof inventoryServiceApiSchema>;

export const paginatedMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const inventoryServiceResponseSchema = z.object({
  message: z.string().optional(),
  data: z.any(),
});

export const inventoryServiceListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryServiceApiSchema),
});

export const inventoryServicePaginatedResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryServiceApiSchema),
  meta: paginatedMetaSchema,
});

export const inventoryServiceDeleteResponseSchema = z.unknown();
