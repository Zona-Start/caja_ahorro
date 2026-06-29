import { apiClient } from '@/lib/api-client';
import {
  inventoryServiceDeleteResponseSchema,
  inventoryServiceListResponseSchema,
  inventoryServicePaginatedResponseSchema,
  inventoryServiceResponseSchema,
} from '../schemas/inventory-services-api.schema';
import type { InventoryService } from '../schemas/inventory-services.schema';

export interface InventoryServicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryParams = (params: InventoryServicesQueryParams): string => {
  const query = new URLSearchParams();
  query.append('page', String(params.page ?? 1));
  query.append('limit', String(params.limit ?? 10));
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  return query.toString();
};

const buildServicePayload = (payload: InventoryService) => {
  const { id, createdAt, updatedAt, ...rest } = payload as any;
  return rest;
};

export const inventoryServicesService = {
  getAll: async (params: InventoryServicesQueryParams) => {
    const response = await apiClient.get(
      `/inventory/services?${buildQueryParams(params)}`,
    );


    return inventoryServiceListResponseSchema.parse(response.data).data;
  },

  getPaginated: async (params: InventoryServicesQueryParams) => {
    const response = await apiClient.get(
      `/inventory/services/paginated?${buildQueryParams(params)}`,
    );
    return inventoryServicePaginatedResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/inventory/services/${id}`);
    return inventoryServiceResponseSchema.parse(response.data).data;
  },

  create: async (payload: InventoryService) => {
    const response = await apiClient.post(
      '/inventory/services',
      buildServicePayload(payload),
    );
    return inventoryServiceResponseSchema.parse(response.data).data;
  },

  update: async (payload: InventoryService) => {
    const { id, createdAt, updatedAt, ...rest } = payload;
    const response = await apiClient.patch(
      `/inventory/services/${id}`,
      rest,
    );
    return inventoryServiceResponseSchema.parse(response.data).data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/inventory/services/${id}`);
    return inventoryServiceDeleteResponseSchema.parse(response.data);
  },
};
