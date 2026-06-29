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
  brand?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
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
  if (params.brand) query.append('brand', params.brand);
  if (params.model) query.append('model', params.model);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  return query.toString();
};

const buildAssetPayload = (payload: InventoryFixedAsset) => {
  const { id, createdAt, updatedAt, categoryName, ...rest } = payload;
  const body: Record<string, unknown> = { ...rest };

  if (body.acquisitionDate instanceof Date) {
    body.acquisitionDate = body.acquisitionDate.toISOString().split('T')[0];
  }
  if (body.lastDepreciationDate instanceof Date) {
    body.lastDepreciationDate = body.lastDepreciationDate.toISOString().split('T')[0];
  } else if (body.lastDepreciationDate === null || body.lastDepreciationDate === undefined || body.lastDepreciationDate === '') {
    delete body.lastDepreciationDate;
  }
  if (body.disposalDate instanceof Date) {
    body.disposalDate = body.disposalDate.toISOString().split('T')[0];
  } else if (body.disposalDate === null || body.disposalDate === undefined || body.disposalDate === '') {
    delete body.disposalDate;
  }

  Object.keys(body).forEach((key) => {
    if (body[key] === null || body[key] === undefined) {
      delete body[key];
    }
  });

  return body;
};

const mapApiToForm = (apiData: Record<string, unknown>): InventoryFixedAsset => {
  return {
    ...apiData,
    acquisitionDate: apiData.acquisitionDate
      ? new Date(apiData.acquisitionDate as string)
      : new Date(),
    lastDepreciationDate: apiData.lastDepreciationDate
      ? new Date(apiData.lastDepreciationDate as string)
      : null,
    disposalDate: apiData.disposalDate
      ? new Date(apiData.disposalDate as string)
      : null,
    description: (apiData.description as string) ?? '',
    serialNumber: (apiData.serialNumber as string) ?? '',
    model: (apiData.model as string) ?? '',
    brand: (apiData.brand as string) ?? '',
    assetCode: (apiData.assetCode as string) ?? '',
    categoryId: (apiData.categoryId as string) ?? '',
    categoryName: (apiData.categoryName as string) ?? '',
    baseCost: Number(apiData.baseCost ?? 0),
    otherCosts: Number(apiData.otherCosts ?? 0),
    purchaseTax: Number(apiData.purchaseTax ?? 0),
    accumulatedDepreciation: Number(apiData.accumulatedDepreciation ?? 0),
    disposalValue: Number(apiData.disposalValue ?? 0),
    usefulLifeYears: Number(apiData.usefulLifeYears ?? 0),
    assetStatus: (apiData.assetStatus as InventoryFixedAsset['assetStatus']) ?? 'ACTIVE',
    depreciationMethod: (apiData.depreciationMethod as InventoryFixedAsset['depreciationMethod']) ?? 'STRAIGHT_LINE',
    disposalReason: (apiData.disposalReason as string) ?? '',
  } as InventoryFixedAsset;
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
    const parsed = inventoryFixedAssetPaginatedResponseSchema.parse(response.data);
    return {
      data: parsed.data.map(mapApiToForm) as unknown as InventoryFixedAsset[],
      meta: parsed.meta,
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/inventory/fixed-assets/${id}`);
    const parsed = inventoryFixedAssetResponseSchema.parse(response.data);
    return mapApiToForm(parsed.data as unknown as Record<string, unknown>);
  },

  create: async (payload: InventoryFixedAsset) => {
    const body = buildAssetPayload(payload);
    const response = await apiClient.post(
      '/inventory/fixed-assets',
      body,
    );
    return inventoryFixedAssetResponseSchema.parse(response.data).data;
  },

  update: async (payload: InventoryFixedAsset) => {
    const body = buildAssetPayload(payload);
    const response = await apiClient.patch(
      `/inventory/fixed-assets/${payload.id}`,
      body,
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
