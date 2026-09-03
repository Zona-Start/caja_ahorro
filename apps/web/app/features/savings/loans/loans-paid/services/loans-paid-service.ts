import { apiClient } from '@/lib/api-client';
import {
  loanPaymentApiResponseSchema,
  loanPaymentByIdResponseSchema,
  loanPaymentMutationSchema,
  loanPaymentDeleteResponseSchema,
  loanPaymentBulkResponseSchema,
} from '../schemas/loans-paid-api-response';
import { associatesLoanSchema } from '../schemas/individual-load-api-schema';

export const loansPaidService = {
  getLoansPaid: async (params: {
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

    const response = await apiClient.get(`/loan-paid?${searchParams}`);
    return loanPaymentApiResponseSchema.parse(response.data);
  },

  getLoanPaidById: async (id: string) => {
    const response = await apiClient.get(`/loan-paid/${id}`);
    return loanPaymentByIdResponseSchema.parse(response.data);
  },

  createLoanPayment: async (payment: Record<string, unknown>) => {
    const response = await apiClient.post('/loan-paid', payment);
    return loanPaymentMutationSchema.parse(response.data);
  },

  deleteLoanPayment: async (id: string) => {
    const response = await apiClient.delete(`/loan-paid/${id}`);
    return loanPaymentDeleteResponseSchema.parse(response.data);
  },

  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/loan-paid/request/${cedula}`);
    return associatesLoanSchema.parse(response.data);
  },

  downloadTemplate: async (): Promise<string> => {
    const response = await apiClient.get('/loan-paid/download-template', {
      responseType: 'arraybuffer',
    });
    const bytes = new Uint8Array(response.data as ArrayBuffer);
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  },

  bulkUpload: async (formData: FormData) => {
    const response = await apiClient.post('/loan-paid/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return loanPaymentBulkResponseSchema.parse(response.data);
  },
};
