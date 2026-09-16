import { apiClient } from '@/lib/api-client';
import type { ExpenseFilters, ExpenseForm } from '../schemas/expenses.schema';

const BASE_URL = '/expenses';

export const expensesService = {
  getMode: async (): Promise<{
    data: {
      mode: 'AGILE' | 'CORPORATE';
      businessType: string;
      hasAccounting: boolean;
      activeModules: string[];
    };
  }> => {
    const response = await apiClient.get(`${BASE_URL}/mode`);
    return response.data;
  },

  getAllPaginated: async (params: ExpenseFilters) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    if (params.paymentSource) query.set('paymentSource', params.paymentSource);
    if (params.type) query.set('type', params.type);
    if (params.nature) query.set('nature', params.nature);
    if (params.status) query.set('status', params.status);
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${query.toString()}`,
    );
    return response.data;
  },

  getConfig: async (): Promise<{
    data: {
      vatRate: number | null;
      islrRate: number | null;
      exchangeRates: Record<string, number | null>;
      exchangeRateDate: string;
    };
  }> => {
    const response = await apiClient.get(`${BASE_URL}/config`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  pay: async (id: string) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/pay`);
    return response.data;
  },

  reject: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/reject`, {
      reason: reason ?? null,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: ExpenseForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
