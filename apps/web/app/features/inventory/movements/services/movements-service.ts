import { apiClient } from '@/lib/api-client';
import {
  inventoryMovementListResponseSchema,
  inventoryMovementResponseSchema,
  stockApiResponseSchema,
} from '../schemas/movements-api.schema';
import type {
  InventoryMovement,
  StockResponse,
} from '../schemas/movements.schema';

export interface MovementsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  itemId?: number;
  itemType?: string;
  movementType?: string;
  documentType?: string;
  documentNumber?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface MovementsPaginatedResponse {
  data: InventoryMovement[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
    nextPage?: number | null;
    previousPage?: number | null;
  };
}

const buildQueryParams = (params: MovementsQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.itemId) query.set('itemId', String(params.itemId));
  if (params.itemType) query.set('itemType', params.itemType);
  if (params.movementType) query.set('movementType', params.movementType);
  if (params.documentType) query.set('documentType', params.documentType);
  if (params.documentNumber) query.set('documentNumber', params.documentNumber);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  return query.toString();
};

export const movementsService = {
  getAll: async (
    params: MovementsQueryParams,
  ): Promise<MovementsPaginatedResponse> => {
    const response = await apiClient.get(
      `/inventory/movements?${buildQueryParams(params)}`,
    );
    const parsed = inventoryMovementListResponseSchema.parse(response.data);
    return {
      data: parsed.data as unknown as InventoryMovement[],
      meta: parsed.meta,
    };
  },

  getById: async (id: number): Promise<InventoryMovement> => {
    const response = await apiClient.get(`/inventory/movements/${id}`);
    return inventoryMovementResponseSchema.parse(response.data)
      .data as unknown as InventoryMovement;
  },

  getStock: async (
    itemType: string,
    itemId: number,
  ): Promise<StockResponse> => {
    const response = await apiClient.get(
      `/inventory/movements/stock/${itemType}/${itemId}`,
    );
    return stockApiResponseSchema.parse(response.data).data as StockResponse;
  },

  create: async (
    payload: object,
  ): Promise<InventoryMovement> => {
    const response = await apiClient.post(
      '/inventory/movements',
      payload,
    );
    return inventoryMovementResponseSchema.parse(response.data)
      .data as unknown as InventoryMovement;
  },

  cancel: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/inventory/movements/${id}`);
    return { message: 'Movimiento cancelado correctamente' };
  },
};
