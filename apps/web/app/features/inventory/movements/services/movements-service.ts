import { apiClient } from '@/lib/api-client';
import {
  inventoryMovementListResponseSchema,
  inventoryMovementResponseSchema,
} from '../schemas/movements-api.schema';
import type { InventoryMovement } from '../schemas/movements.schema';

export interface MovementsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  movementType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  productId?: string;
  supplierId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MovementsPaginatedResponse {
  data: InventoryMovement[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

const buildQueryParams = (params: MovementsQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.movementType) query.set('movementType', params.movementType);
  if (params.status) query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.productId) query.set('productId', params.productId);
  if (params.supplierId) query.set('supplierId', params.supplierId);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  return query.toString();
};

const mapApiToForm = (api: Record<string, unknown>): InventoryMovement => ({
  ...api,
  movementDate: api.movementDate ? new Date(api.movementDate as string) : new Date(),
  items: Array.isArray(api.items)
    ? api.items.map((i: Record<string, unknown>) => ({
        ...i,
        unitCost: Number(i.unitCost ?? 0),
        totalCost: Number(i.totalCost ?? 0),
        quantity: Number(i.quantity ?? 0),
      }))
    : [],
} as unknown as InventoryMovement);

const buildPayload = (data: InventoryMovement) => {
  const { id, movementNumber, createdAt, updatedAt, supplierName, ...rest } = data;
  const body: Record<string, unknown> = {
    ...rest,
    movementDate: rest.movementDate instanceof Date
      ? rest.movementDate.toISOString().split('T')[0]
      : rest.movementDate,
  };

  Object.keys(body).forEach((key) => {
    if (body[key] === null || body[key] === undefined || body[key] === '') {
      delete body[key];
    }
  });

  if (body.items && Array.isArray(body.items)) {
    body.items = (body.items as Record<string, unknown>[]).map((item) => {
      const clean: Record<string, unknown> = { ...item };
      delete clean.id;
      delete clean.productName;
      delete clean.productCode;
      delete clean.totalCost;
      return clean;
    });
  }

  return body;
};

export const movementsService = {
  getAll: async (params: MovementsQueryParams): Promise<MovementsPaginatedResponse> => {
    const response = await apiClient.get(
      `/inventory/movements?${buildQueryParams(params)}`,
    );
    const parsed = inventoryMovementListResponseSchema.parse(response.data);
    return {
      data: parsed.data.map((d) => mapApiToForm(d as unknown as Record<string, unknown>)) as unknown as InventoryMovement[],
      meta: parsed.meta,
    };
  },

  getById: async (id: string): Promise<InventoryMovement> => {
    const response = await apiClient.get(`/inventory/movements/${id}`);
    const parsed = inventoryMovementResponseSchema.parse(response.data);
    return mapApiToForm(parsed.data as unknown as Record<string, unknown>);
  },

  create: async (payload: InventoryMovement): Promise<InventoryMovement> => {
    const response = await apiClient.post('/inventory/movements', buildPayload(payload));
    const parsed = inventoryMovementResponseSchema.parse(response.data);
    return mapApiToForm(parsed.data as unknown as Record<string, unknown>);
  },

  update: async (payload: InventoryMovement): Promise<InventoryMovement> => {
    const response = await apiClient.patch(`/inventory/movements/${payload.id}`, buildPayload(payload));
    const parsed = inventoryMovementResponseSchema.parse(response.data);
    return mapApiToForm(parsed.data as unknown as Record<string, unknown>);
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.patch(`/inventory/movements/${id}/cancel`);
  },
};
