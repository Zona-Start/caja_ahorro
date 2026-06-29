import { apiClient } from '@/lib/api-client';
import type { BankAccountForm } from '../schemas/bank-account.schema';
import type { BalancesByCurrency } from '../schemas/bank-account-response-api';

const BASE_URL = '/bakings/bank-accounts';

export interface BankAccountQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  accountType?: string;
  currencyCode?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryParams = (params: BankAccountQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.accountType) query.set('accountType', params.accountType);
  if (params.currencyCode) query.set('currencyCode', params.currencyCode);
  if (params.isActive) query.set('status', params.isActive);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  return query.toString();
};

export const bankAccountService = {
  getAllPaginated: async (params: BankAccountQueryParams) => {
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${buildQueryParams(params)}`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: BankAccountForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<BankAccountForm>) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  getBalancesByCurrency: async (): Promise<{
    data: BalancesByCurrency[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/balances-by-currency`);
    return response.data;
  },

  reverse: async (id: string) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/reverse`);
    return response.data;
  },
};
