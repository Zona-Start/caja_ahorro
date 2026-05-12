import { apiClient } from '@/lib/api-client';
import {
  inventoryFixedAssetDeleteResponseSchema,
  inventoryFixedAssetListResponseSchema,
  inventoryFixedAssetPaginatedResponseSchema,
  inventoryFixedAssetResponseSchema,
} from '../schemas/inventory-fixed-assets-api.schema';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';

export interface InventoryFixedAssetsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  assetStatus?: string;
  categoryId?: string;
  depreciationMethod?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryParams = (
  params: InventoryFixedAssetsQueryParams,
): string => {
  const query = new URLSearchParams();
  query.append('page', String(params.page ?? 1));
  query.append('limit', String(params.limit ?? 10));
  if (params.search) query.append('search', params.search);
  if (params.assetStatus) query.append('assetStatus', params.assetStatus);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.depreciationMethod)
    query.append('depreciationMethod', params.depreciationMethod);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  return query.toString();
};

const buildAssetPayload = (payload: InventoryFixedAsset) => {
  const { id, createdAt, updatedAt, ...rest } = payload;
  return { ...rest, acquisitionDate: rest.acquisitionDate.toISOString() };
};

export const inventoryFixedAssetsService = {
  getAll: async (params: InventoryFixedAssetsQueryParams) => {
    const response = await apiClient.get(
      `/inventory/fixed-assets?${buildQueryParams(params)}`,
    );
    return inventoryFixedAssetListResponseSchema.parse(response.data).data;
  },

  getPaginated: async (params: InventoryFixedAssetsQueryParams) => {
    const response = await apiClient.get(
      `/inventory/fixed-assets/paginated?${buildQueryParams(params)}`,
    );
    return inventoryFixedAssetPaginatedResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/inventory/fixed-assets/${id}`);
    return inventoryFixedAssetResponseSchema.parse(response.data).data;
  },

  create: async (payload: InventoryFixedAsset) => {
    const response = await apiClient.post(
      '/inventory/fixed-assets',
      buildAssetPayload(payload),
    );
    return inventoryFixedAssetResponseSchema.parse(response.data).data;
  },

  update: async (payload: InventoryFixedAsset) => {
    const { id, createdAt, updatedAt, ...rest } = payload;
    const response = await apiClient.patch(
      `/inventory/fixed-assets/${id}`,
      { ...rest, acquisitionDate: rest.acquisitionDate.toISOString() },
    );
    return inventoryFixedAssetResponseSchema.parse(response.data).data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(
      `/inventory/fixed-assets/${id}`,
    );
    return inventoryFixedAssetDeleteResponseSchema.parse(response.data);
  },
};
