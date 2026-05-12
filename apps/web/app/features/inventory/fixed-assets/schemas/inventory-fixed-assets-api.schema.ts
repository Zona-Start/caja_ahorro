import { z } from 'zod';
import {
  FixedAssetStatus,
  DepreciationMethod,
} from './inventory-fixed-assets-options';

export const inventoryFixedAssetApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  categoryId: z.string(),
  assetCode: z.string(),
  serialNumber: z.string(),
  model: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  acquisitionDate: z.string(),
  assetStatus: z.nativeEnum(FixedAssetStatus),
  usefulLifeYears: z.number(),
  depreciationMethod: z.nativeEnum(DepreciationMethod),
  accumulatedDepreciation: z.number(),
  baseCost: z.number(),
  otherCosts: z.number(),
  purchaseTax: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type InventoryFixedAssetApi = z.infer<
  typeof inventoryFixedAssetApiSchema
>;

export const paginatedMetaSchema = z.object({
  totalItems: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export const inventoryFixedAssetResponseSchema = z.object({
  message: z.string(),
  data: inventoryFixedAssetApiSchema,
});

export const inventoryFixedAssetListResponseSchema = z.object({
  message: z.string(),
  data: z.array(inventoryFixedAssetApiSchema),
});

export const inventoryFixedAssetPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(inventoryFixedAssetApiSchema),
  meta: paginatedMetaSchema,
});

export const inventoryFixedAssetDeleteResponseSchema = z.object({
  message: z.string(),
});
