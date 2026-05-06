import { apiClient } from '@/lib/api-client';
import {
  currencyDeleteResponseSchema,
  currencyResponseSchema,
  currenciesListResponseSchema,
} from '../schemas/currencies-api.schema';
import { currencySchema, type CurrencyMutation } from '../schemas/currencies.schema';

export interface CurrenciesFilters {
  search?: string;
  isActive?: boolean;
}

export const currenciesService = {
  getAll: async (filters?: CurrenciesFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));

    const response = await apiClient.get('/core/currencies', { params });
    const data = currenciesListResponseSchema.parse(response.data);
    return data.map((c) => currencySchema.parse(c));
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/currencies/${id}`);
    return currencyResponseSchema.parse(response.data);
  },

  create: async (payload: CurrencyMutation) => {
    const response = await apiClient.post('/core/currencies', payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? currencySchema.parse(response.data[0]) : null;
    }
    return currencySchema.parse(response.data);
  },

  update: async (id: string, payload: Partial<CurrencyMutation>) => {
    const response = await apiClient.patch(`/core/currencies/${id}`, payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? currencySchema.parse(response.data[0]) : null;
    }
    return currencySchema.parse(response.data);
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/core/currencies/${id}`);
    if (response.status === 204) {
      return { message: 'Currency deleted successfully' };
    }
    return currencyDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: CurrencyMutation) => {
    return payload.id
      ? currenciesService.update(payload.id, payload)
      : currenciesService.create(payload);
  },
};