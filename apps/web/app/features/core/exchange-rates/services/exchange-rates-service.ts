import { apiClient } from '@/lib/api-client';
import {
  exchangeRatesPageSchema,
  latestRateSchema,
  syncBcvResponseSchema,
  type ExchangeRatesPage,
  type LatestRate,
  type ManualRateInput,
  type SyncBcvResponse,
} from '../schemas/exchange-rates.schema';

export const exchangeRatesService = {
  getAll: async ({
    page = 1,
    limit = 10,
  }: { page?: number; limit?: number } = {}): Promise<ExchangeRatesPage> => {
    const response = await apiClient.get('/core/exchange-rates', {
      params: { page, limit },
    });
    return exchangeRatesPageSchema.parse(response.data);
  },

  getLatest: async (currencyCode: 'USD' | 'EUR'): Promise<LatestRate> => {
    const response = await apiClient.get(
      `/core/exchange-rates/latest/${currencyCode}`,
    );
    return latestRateSchema.parse(response.data);
  },

  setManual: async (payload: ManualRateInput) => {
    const response = await apiClient.post('/core/exchange-rates/manual', {
      currencyCode: payload.currencyCode,
      rate: payload.rate,
      ...(payload.rateDate ? { rateDate: payload.rateDate } : {}),
    });
    return response.data;
  },

  syncWithBcv: async (): Promise<SyncBcvResponse> => {
    const response = await apiClient.post('/core/exchange-rates/sync');
    return syncBcvResponseSchema.parse(response.data);
  },
};
