import { apiClient } from '@/lib/api-client';
import type {
  ExpenseCategory,
  ExpenseCategoryMutation,
} from '../schemas/expense-categories.schema';

const BASE_URL = '/expense-categories';

export interface ExpenseCategoriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ExpenseCategoriesPaginatedResponse {
  data: ExpenseCategory[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

const buildQueryParams = (params: ExpenseCategoriesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
  });
  return query.toString();
};

export const expenseCategoriesService = {
  getAll: async (): Promise<{ data: Array<{ id: string; name: string }> }> => {
    const response = await apiClient.get(BASE_URL);
    return response.data;
  },

  getAllPaginated: async (
    params: ExpenseCategoriesQueryParams,
  ): Promise<ExpenseCategoriesPaginatedResponse> => {
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${buildQueryParams(params)}`,
    );
    const data = response.data.data ?? [];
    return {
      data,
      meta: response.data.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalCount: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  getById: async (id: string): Promise<{ data: ExpenseCategory }> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: ExpenseCategoryMutation) => {
    const response = await apiClient.post(BASE_URL, {
      name: payload.name,
      accountingAccountId: payload.accountingAccountId ?? null,
      isActive: payload.isActive,
    });
    return response.data;
  },

  update: async (id: string, payload: ExpenseCategoryMutation) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, {
      name: payload.name,
      accountingAccountId: payload.accountingAccountId ?? null,
      isActive: payload.isActive,
    });
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  save: async (payload: ExpenseCategoryMutation) =>
    payload.id
      ? expenseCategoriesService.update(payload.id, payload)
      : expenseCategoriesService.create(payload),
};
