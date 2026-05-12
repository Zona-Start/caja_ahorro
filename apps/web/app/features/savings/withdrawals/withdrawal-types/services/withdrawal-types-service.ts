import { apiClient } from '@/lib/api-client';
import {
  withdrawalTypeResponseSchema,
  withdrawalTypesListResponseSchema,
} from '../schemas/withdrawal-types-api.schema';
import {
  type WithdrawalType,
  type WithdrawalTypeMutation,
} from '../schemas/withdrawal-types.schema';

export interface WithdrawalTypesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface WithdrawalTypesPaginatedResponse {
  data: WithdrawalType[];
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

const buildQueryParams = (params: WithdrawalTypesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  });
  return query.toString();
};

export const withdrawalTypesService = {
  getAll: async (
    params: WithdrawalTypesQueryParams,
  ): Promise<WithdrawalTypesPaginatedResponse> => {
    const response = await apiClient.get(
      `/savings-banks/withdrawal-types/paginated?${buildQueryParams(params)}`,
    );
    try {
      const parsed = withdrawalTypesListResponseSchema.parse(response.data);
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

  getById: async (id: number): Promise<WithdrawalType> => {
    const response = await apiClient.get(
      `/savings-banks/withdrawal-types/${id}`,
    );
    return response.data;
  },

  create: async (payload: WithdrawalTypeMutation): Promise<WithdrawalType> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post(
      '/savings-banks/withdrawal-types',
      createPayload,
    );
    return withdrawalTypeResponseSchema.parse(
      response.data,
    ) as unknown as WithdrawalType;
  },

  update: async (payload: WithdrawalTypeMutation): Promise<WithdrawalType> => {
    if (!payload.id) {
      throw new Error('El id del tipo de retiro es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/savings-banks/withdrawal-types/${id}`,
      updatePayload,
    );
    return response.data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/savings-banks/withdrawal-types/${id}`);
    return { message: 'Tipo de retiro eliminado correctamente' };
  },

  save: async (payload: WithdrawalTypeMutation) => {
    return payload.id
      ? withdrawalTypesService.update(payload)
      : withdrawalTypesService.create(payload);
  },
};
