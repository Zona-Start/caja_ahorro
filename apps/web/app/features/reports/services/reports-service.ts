import { apiClient } from '@/lib/api-client';

const buildSearchParams = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      searchParams.append(k, v);
    }
  });
  return searchParams;
};

export const reportsService = {
  exportAssociatesPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/associates/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportHaberesPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/haberes/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportWithdrawalsPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/withdrawals/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportVariationsPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/variations/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportLoansPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/loans/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportQuotasPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/quotas/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportCreditsPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/credits/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },

  exportCreditQuotasPdf: async (params: Record<string, string | undefined>) => {
    const response = await apiClient.get(
      `/reports/credit-quotas/pdf?${buildSearchParams(params)}`,
      { responseType: 'arraybuffer' },
    );
    return response.data as ArrayBuffer;
  },
};
