import { apiClient } from '@/lib/api-client';
import {
  creditTypeResponseSchema,
  creditTypesListResponseSchema,
} from '../schemas/credit-types-api.schema';
import { type CreditType, type CreditTypeMutation } from '../schemas/credit-types.schema';

export interface CreditTypesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreditTypesPaginatedResponse {
  data: CreditType[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

const buildQueryParams = (params: CreditTypesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  });
  return query.toString();
};

export const creditTypesService = {
  getAll: async (params: CreditTypesQueryParams): Promise<CreditTypesPaginatedResponse> => {
    const response = await apiClient.get(
      `/savings-banks/credit-types/paginated?${buildQueryParams(params)}`,
    );

    try {
      const parsed = creditTypesListResponseSchema.parse(response.data);
      return parsed;
    } catch {
      const data = response.data.data ?? response.data;
      return {
        data,
        meta: response.data.meta ?? {
          page: 1,
          limit: 10,
          totalCount: data?.length ?? 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
      };
    }
  },

  getById: async (id: number): Promise<CreditType> => {
    const response = await apiClient.get(`/savings-banks/credit-types/${id}`);
    return response.data;
  },

  create: async (payload: CreditTypeMutation): Promise<CreditType> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post(
      '/savings-banks/credit-types',
      createPayload,
    );
    return response.data;
  },

  update: async (payload: CreditTypeMutation): Promise<CreditType> => {
    if (!payload.id) {
      throw new Error('El id del tipo de crédito es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/savings-banks/credit-types/${id}`,
      updatePayload,
    );
    return response.data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/savings-banks/credit-types/${id}`);
    return { message: 'Tipo de crédito eliminado correctamente' };
  },

  save: async (payload: CreditTypeMutation) => {
    return payload.id
      ? creditTypesService.update(payload)
      : creditTypesService.create(payload);
  },
};