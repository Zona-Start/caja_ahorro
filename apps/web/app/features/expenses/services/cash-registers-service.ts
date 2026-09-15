import { apiClient } from '@/lib/api-client';
import type { CashRegisterForm } from '../schemas/cash-registers.schema';

const BASE_URL = '/cash-registers';
const SESSIONS_URL = '/cash-sessions';

export interface CashRegisterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const cashRegistersService = {
  getAllPaginated: async (params: CashRegisterQueryParams) => {
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

  create: async (payload: CashRegisterForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<CashRegisterForm>) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  getActiveSession: async (cashRegisterId: string) => {
    const response = await apiClient.get(
      `${SESSIONS_URL}/active/${cashRegisterId}`,
    );
    return response.data;
  },

  openSession: async (payload: {
    cashRegisterId: string;
    initialBalance: number;
  }) => {
    const response = await apiClient.post(`${SESSIONS_URL}/open`, payload);
    return response.data;
  },

  closeSession: async (
    id: string,
    payload: { actualPhysicalBalance: number },
  ) => {
    const response = await apiClient.patch(
      `${SESSIONS_URL}/close/${id}`,
      payload,
    );
    return response.data;
  },
};
