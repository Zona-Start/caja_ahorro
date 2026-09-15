import { apiClient } from '@/lib/api-client';
import type { CostCenterForm } from '../schemas/cost-centers.schema';

const BASE_URL = '/cost-centers';

export interface CostCenterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const costCentersService = {
  getAllPaginated: async (params: CostCenterQueryParams) => {
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

  create: async (payload: CostCenterForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<CostCenterForm>) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  getBudgetUsage: async (id: string, month?: string) => {
    const query = month ? `?month=${month}` : '';
    const response = await apiClient.get(`${BASE_URL}/budget/${id}${query}`);
    return response.data;
  },
};
