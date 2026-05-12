import { apiClient } from '@/lib/api-client';
import {
  supplierPaymentHistorySchema,
  supplierPaymentListResponseSchema,
  supplierPaymentPendingSchema,
  supplierPaymentResponseSchema,
} from '../schemas/supplier-payment-api.schema';
import type {
  SupplierPaymentPay,
  SupplierPaymentAdvance,
  SupplierPaymentReverse,
} from '../schemas/supplier-payment.schema';
import { supplierPaymentApiSchema } from '../schemas/supplier-payment-api.schema';

export interface SupplierPaymentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const supplierPaymentsService = {
  getAll: async (params: SupplierPaymentsQueryParams) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    });

    const response = await apiClient.get(
      `/administration/supplier-payments?${query.toString()}`,
    );

    try {
      return supplierPaymentListResponseSchema.parse(response.data);
    } catch {
      const data = supplierPaymentApiSchema.array().parse(response.data);
      return {
        data,
        meta: {
          totalItems: data.length,
          itemCount: data.length,
          itemsPerPage: params.limit ?? 10,
          totalPages: Math.ceil(data.length / (params.limit ?? 10)),
          currentPage: params.page ?? 1,
        },
      };
    }
  },

  getPending: async () => {
    const response = await apiClient.get('/administration/supplier-payments/pending');
    return supplierPaymentPendingSchema.parse(response.data);
  },

  getHistory: async (accountPayableId: number) => {
    const response = await apiClient.get(
      `/administration/supplier-payments/history/accounts-payable/${accountPayableId}`,
    );
    return supplierPaymentHistorySchema.parse(response.data);
  },

  pay: async (payload: SupplierPaymentPay) => {
    const response = await apiClient.post('/administration/supplier-payments/pay', payload);
    return supplierPaymentApiSchema.parse(response.data);
  },

  payAdvance: async (payload: SupplierPaymentAdvance) => {
    const response = await apiClient.post('/administration/supplier-payments/pay-advance', payload);
    return supplierPaymentApiSchema.parse(response.data);
  },

  reverse: async (payload: SupplierPaymentReverse) => {
    const response = await apiClient.post('/administration/supplier-payments/reverse', payload);
    return supplierPaymentResponseSchema.parse(response.data);
  },
};
