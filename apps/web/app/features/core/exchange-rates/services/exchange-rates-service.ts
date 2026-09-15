import { apiClient } from '@/lib/api-client';
import {
  latestRateSchema,
  type LatestRate,
  type ManualRateInput,
} from '../schemas/exchange-rates.schema';

export const exchangeRatesService = {
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
};
