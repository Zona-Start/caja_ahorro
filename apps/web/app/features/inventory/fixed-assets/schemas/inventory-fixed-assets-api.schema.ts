import { z } from 'zod';
import {
  FixedAssetStatus,
  DepreciationMethod,
} from './inventory-fixed-assets-options';

export const inventoryFixedAssetApiSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  categoryId: z.string(),
  categoryName: z.string().optional().nullable(),
  assetCode: z.string().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  acquisitionDate: z.string().optional().nullable(),
  baseCost: z.number().optional().nullable(),
  otherCosts: z.number().optional().nullable(),
  purchaseTax: z.number().optional().nullable(),
  totalCost: z.number().optional().nullable(),
  assetStatus: z.nativeEnum(FixedAssetStatus).optional(),
  usefulLifeYears: z.number().optional().nullable(),
  depreciationMethod: z.nativeEnum(DepreciationMethod).optional().nullable(),
  accumulatedDepreciation: z.number().optional().nullable(),
  lastDepreciationDate: z.string().optional().nullable(),
  disposalDate: z.string().optional().nullable(),
  disposalReason: z.string().optional().nullable(),
  disposalValue: z.number().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type InventoryFixedAssetApi = z.infer<
  typeof inventoryFixedAssetApiSchema
>;

export const paginatedMetaSchema = z.object({
  totalCount: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const inventoryFixedAssetResponseSchema = z.object({
  message: z.string().optional(),
  data: inventoryFixedAssetApiSchema,
});

export const inventoryFixedAssetListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryFixedAssetApiSchema),
});

export const inventoryFixedAssetPaginatedResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(inventoryFixedAssetApiSchema),
  meta: paginatedMetaSchema,
});

export const inventoryFixedAssetDeleteResponseSchema = z.object({
  message: z.string().optional(),
});
