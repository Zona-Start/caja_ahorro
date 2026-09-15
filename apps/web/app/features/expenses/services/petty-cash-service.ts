import { apiClient } from '@/lib/api-client';
import type { PettyCashForm } from '../schemas/petty-cash.schema';

const BASE_URL = '/petty-cash-funds';

export interface PettyCashQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const pettyCashService = {
  getAllPaginated: async (params: PettyCashQueryParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${query.toString()}`,
    );
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get(BASE_URL);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: PettyCashForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<PettyCashForm>) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  replenish: async (
    id: string,
    payload: { amount: number; concept: string },
  ) => {
    const response = await apiClient.patch(
      `${BASE_URL}/replenish/${id}`,
      payload,
    );
    return response.data;
  },

  disburse: async (
    id: string,
    payload: { amount: number; concept: string },
  ) => {
    const response = await apiClient.patch(
      `${BASE_URL}/disburse/${id}`,
      payload,
    );
    return response.data;
  },
};
