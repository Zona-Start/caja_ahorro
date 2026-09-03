import { apiClient } from '@/lib/api-client';
import {
  creditPaymentApiResponseSchema,
  creditPaymentByIdResponseSchema,
  creditPaymentMutationSchema,
  creditPaymentDeleteResponseSchema,
  creditPaymentBulkResponseSchema,
} from '../schemas/credits-paid-api-response';
import { associatesCreditSchema } from '../schemas/individual-credits-api-schema';

export const creditsPaidService = {
  getCreditsPaid: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    bank?: string;
    type?: string;
    method?: string;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.bank && { bank: params.bank }),
      ...(params.type && { type: params.type }),
      ...(params.method && { method: params.method }),
    });

    const response = await apiClient.get(`/credit-paid?${searchParams}`);
    return creditPaymentApiResponseSchema.parse(response.data);
  },

  getCreditPaidById: async (id: string) => {
    const response = await apiClient.get(`/credit-paid/${id}`);
    return creditPaymentByIdResponseSchema.parse(response.data);
  },

  createCreditPayment: async (payment: Record<string, unknown>) => {
    const response = await apiClient.post('/credit-paid', payment);
    return creditPaymentMutationSchema.parse(response.data);
  },

  deleteCreditPayment: async (id: string) => {
    const response = await apiClient.delete(`/credit-paid/${id}`);
    return creditPaymentDeleteResponseSchema.parse(response.data);
  },

  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/credit-paid/request/${cedula}`);
    return associatesCreditSchema.parse(response.data);
  },

  downloadTemplate: async (): Promise<string> => {
    const response = await apiClient.get('/credit-paid/download-template', {
      responseType: 'arraybuffer',
    });
    const bytes = new Uint8Array(response.data as ArrayBuffer);
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  },

  bulkUpload: async (formData: FormData) => {
    const response = await apiClient.post('/credit-paid/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return creditPaymentBulkResponseSchema.parse(response.data);
  },
};
