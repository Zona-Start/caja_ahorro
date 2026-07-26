import { apiClient } from '@/lib/api-client';
import {
  pendingPaymentsResponseSchema,
  supplierPaymentListResponseSchema,
  availableCreditsSchema,
  allCreditsResponseSchema,
} from '../schemas/supplier-payment-api.schema';

export interface SupplierPaymentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierIds?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PendingPaymentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  status?: string;
}

export interface BulkPaymentPayload {
  supplierId: string;
  accountPayableIds: string[];
  bankAccountId: string;
  paymentDescription: string;
  paymentMethod: string;
  bankReference?: string;
  transactionDate: string;
  totalAmount: number;
  creditAplied?: { id: string; transactionType: string; appliedAmount: number }[];
}

export interface PayAdvancePayload {
  supplierId: string;
  transactionId: string;
  bankAccountId: string;
  paymentDescription?: string;
  paymentMethod: string;
  bankReference?: string;
  transactionDate?: string;
  amount: number;
  currencyCode?: string;
}

export interface ReversePaymentsPayload {
  paymentIds: string[];
}

const buildQueryParams = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.set(key, String(value));
      }
    }
  }
  return query.toString();
};

export const supplierPaymentsService = {
  getHistory: async (params: SupplierPaymentsQueryParams) => {
    const query = buildQueryParams(params);
    const response = await apiClient.get(
      `/administration/supplier-payments/by-suppliers?${query}`,
    );
    return supplierPaymentListResponseSchema.parse({
      ...response.data,
      data: response.data.data?.data || [],
      meta: response.data.data?.meta || { page: 1, limit: 10, totalCount: 0, totalPages: 0 },
    });
  },

  getPending: async (params: PendingPaymentsQueryParams) => {
    const query = buildQueryParams(params);
    const response = await apiClient.get(
      `/administration/supplier-payments/pending?${query}`,
    );
    return pendingPaymentsResponseSchema.parse(response.data);
  },

  getAvailableCredits: async (supplierId: string) => {
    const response = await apiClient.get(
      `/administration/supplier-payments/supplier-available-credits/${supplierId}`,
    );
    return availableCreditsSchema.parse(response.data.data || response.data);
  },

  getAllCredits: async () => {
    const response = await apiClient.get(
      '/administration/supplier-payments/all-credits',
    );
    return allCreditsResponseSchema.parse(response.data);
  },

  pay: async (payload: BulkPaymentPayload) => {
    const response = await apiClient.post('/administration/supplier-payments/pay', payload, {
      timeout: 60000,
    });
    return response.data;
  },

  payAdvance: async (payload: PayAdvancePayload) => {
    const response = await apiClient.post('/administration/supplier-payments/pay-advance', payload);
    return response.data;
  },

  createAdvance: async (payload: {
    supplierId: string;
    amount: number;
    bankAccountId: string;
    paymentMethod: string;
    paymentDescription?: string;
    bankReference?: string;
    transactionDate?: string;
  }) => {
    const advanceRes = await apiClient.post('/purchasing/accounts-payable/advance', {
      supplierId: payload.supplierId,
      amount: payload.amount,
      observations: payload.paymentDescription || 'Anticipo a proveedor',
    });
    const advanceData = advanceRes.data;

    if (payload.bankAccountId) {
      await apiClient.post('/administration/supplier-payments/pay-advance', {
        supplierId: payload.supplierId,
        transactionId: advanceData.id || advanceData.transactionId,
        bankAccountId: payload.bankAccountId,
        paymentMethod: payload.paymentMethod,
        paymentDescription: payload.paymentDescription,
        bankReference: payload.bankReference,
        transactionDate: payload.transactionDate,
        amount: payload.amount,
        currencyCode: 'VES',
      });
    }

    return advanceData;
  },

  reverse: async (payload: ReversePaymentsPayload) => {
    const response = await apiClient.post('/administration/supplier-payments/reverse', payload);
    return response.data;
  },
};
