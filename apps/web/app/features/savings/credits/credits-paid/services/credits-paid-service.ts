import { apiClient } from '@/lib/api-client';
import {
  creditPaymentApiResponseSchema,
  creditPaymentByIdResponseSchema,
  creditPaymentMutationSchema,
  creditPaymentDeleteResponseSchema,
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
};
