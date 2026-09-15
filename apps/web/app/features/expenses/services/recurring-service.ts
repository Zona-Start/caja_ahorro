import { apiClient } from '@/lib/api-client';
import type {
  RecurringForm,
  RecurringTemplate,
} from '../schemas/recurring.schema';

const BASE_URL = '/recurring-expenses';

export interface RecurringQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const recurringService = {
  getAllPaginated: async (params: RecurringQueryParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${query.toString()}`,
    );
    return response.data as {
      data: RecurringTemplate[];
      meta: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
  },

  create: async (payload: RecurringForm) => {
    const response = await apiClient.post(BASE_URL, {
      ...payload,
      supplierId: payload.supplierId || undefined,
      description: payload.description || undefined,
      bankAccountId: payload.bankAccountId || undefined,
      pettyCashFundId: payload.pettyCashFundId || undefined,
    });
    return response.data;
  },

  update: async (id: string, payload: RecurringForm) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, {
      ...payload,
      supplierId: payload.supplierId || undefined,
      description: payload.description || undefined,
      bankAccountId: payload.bankAccountId || undefined,
      pettyCashFundId: payload.pettyCashFundId || undefined,
    });
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
