import { apiClient } from '@/lib/api-client';
import {
  loanTypeResponseSchema,
  loanTypesListResponseSchema,
} from '../schemas/loan-types-api.schema';
import { type LoanType, type LoanTypeMutation } from '../schemas/loan-types.schema';

export interface LoanTypesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LoanTypesPaginatedResponse {
  data: LoanType[];
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

const buildQueryParams = (params: LoanTypesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  });
  return query.toString();
};

export const loanTypesService = {
  getAll: async (params: LoanTypesQueryParams): Promise<LoanTypesPaginatedResponse> => {
    const response = await apiClient.get(
      `/savings-banks/loan-types/paginated?${buildQueryParams(params)}`,
    );

    try {
      const parsed = loanTypesListResponseSchema.parse(response.data);
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

  getById: async (id: number): Promise<LoanType> => {
    const response = await apiClient.get(`/savings-banks/loan-types/${id}`);
    return response.data;
  },

  create: async (payload: LoanTypeMutation): Promise<LoanType> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post(
      '/savings-banks/loan-types',
      createPayload,
    );
    return response.data;
  },

  update: async (payload: LoanTypeMutation): Promise<LoanType> => {
    if (!payload.id) {
      throw new Error('El id del tipo de préstamo es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/savings-banks/loan-types/${id}`,
      updatePayload,
    );
    return response.data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/savings-banks/loan-types/${id}`);
    return { message: 'Tipo de préstamo eliminado correctamente' };
  },

  save: async (payload: LoanTypeMutation) => {
    return payload.id
      ? loanTypesService.update(payload)
      : loanTypesService.create(payload);
  },
};