import { apiClient } from '@/lib/api-client';
import {
  bankMovementListResponseSchema,
  bankMovementResponseSchema,
} from '../schemas/bank-movement-api.schema';
import type {
  BankMovement,
  BankMovementForm,
} from '../schemas/bank-movement.schema';

export interface BankMovementsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  bankAccountId?: number;
  paymentMethod?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

interface BankMovementsPaginatedResponse {
  data: BankMovement[];
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

const buildQueryParams = (params: BankMovementsQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.bankAccountId) query.set('bankAccountId', String(params.bankAccountId));
  if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params.category) query.set('category', params.category);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  return query.toString();
};

export const bankMovementsService = {
  getAll: async (
    params: BankMovementsQueryParams,
  ): Promise<BankMovementsPaginatedResponse> => {
    const response = await apiClient.get(
      `/savings-banks/bank-movements?${buildQueryParams(params)}`,
    );
    const parsed = bankMovementListResponseSchema.parse(response.data);
    return {
      data: parsed.data as unknown as BankMovement[],
      meta: parsed.meta,
    };
  },

  getById: async (id: number): Promise<BankMovement> => {
    const response = await apiClient.get(
      `/savings-banks/bank-movements/${id}`,
    );
    return bankMovementResponseSchema.parse(response.data)
      .data as unknown as BankMovement;
  },

  create: async (payload: BankMovementForm): Promise<BankMovement> => {
    const response = await apiClient.post(
      '/savings-banks/bank-movements',
      payload,
    );
    return bankMovementResponseSchema.parse(response.data)
      .data as unknown as BankMovement;
  },

  update: async (
    id: number,
    payload: BankMovementForm,
  ): Promise<BankMovement> => {
    const response = await apiClient.patch(
      `/savings-banks/bank-movements/${id}`,
      payload,
    );
    return bankMovementResponseSchema.parse(response.data)
      .data as unknown as BankMovement;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/savings-banks/bank-movements/${id}`);
    return { message: 'Movimiento bancario eliminado correctamente' };
  },

  save: async (
    payload: BankMovementForm & { id?: number },
  ): Promise<BankMovement> => {
    if (payload.id) {
      const { id, ...data } = payload;
      return bankMovementsService.update(id, data);
    }
    return bankMovementsService.create(payload as BankMovementForm);
  },
};
