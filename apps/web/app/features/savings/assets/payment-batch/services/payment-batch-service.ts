import { apiClient } from '@/lib/api-client';

export interface PaymentBatchItem {
  id: string;
  paymentBatchId: string;
  itemType: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION';
  sourceId: string;
  amount: string;
  beneficiaryName: string;
  beneficiaryId: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountType: string;
  status: string;
  rejectionReason?: string | null;
}

export interface PaymentBatch {
  id: string;
  paymentBatchReference: string;
  description: string | null;
  batchType: string;
  status: string;
  recordCount: number;
  totalAmount: string;
  currencyCode: string;
  bankId: string | null;
  bankFileName: string | null;
  bankReference: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bank?: {
    id: string;
    name: string;
    accountNumber: string;
  };
  items?: PaymentBatchItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ApprovedItem {
  id: string;
  associateId?: string;
  associateCedula?: string;
  associateName?: string;
  reference: string | null;
  approvalDate?: string;
  amount: string;
}

export const paymentBatchService = {
  getPaymentBatches: async (filters: {
    page?: number;
    limit?: number;
    status?: string | null;
    search?: string | null;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<PaymentBatch>> => {
    const params = new URLSearchParams();
    params.set('page', String(filters.page || 1));
    params.set('limit', String(filters.limit || 10));
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const response = await apiClient.get(
      `/savings-banks/payment-batches?${params}`,
    );
    return response.data;
  },

  getPaymentBatchDetails: async (id: string): Promise<PaymentBatch> => {
    const response = await apiClient.get(`/savings-banks/payment-batches/${id}`);
    return response.data;
  },

  createPaymentBatch: async (dto: {
    bankAccountId: string;
    currencyCode: string;
    description?: string;
    batchType?: string;
    items: { type: string; sourceId: string }[];
  }): Promise<{ id: string; recordCount: number; totalAmount: string; reference: string }> => {
    const response = await apiClient.post('/savings-banks/payment-batches', dto);
    return response.data;
  },

  markAsUploaded: async (id: string) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/uploaded`,
    );
    return response.data;
  },

  confirmPaymentBatch: async (
    id: string,
    dto: {
      processedAt: string;
      bankReference?: string;
      items: { itemId: string; processed: boolean; rejectionReason?: string }[];
    },
  ) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/confirm`,
      dto,
    );
    return response.data;
  },

  cancelPaymentBatch: async (id: string) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/cancel`,
    );
    return response.data;
  },

  downloadTxtFile: async (id: string, fallbackName?: string) => {
    const response = await apiClient.get(
      `/savings-banks/payment-batches/${id}/txt`,
      { responseType: 'text' },
    );
    const headers = response.headers as Record<string, string>;
    const fileName = fallbackName
      ? `${fallbackName}.txt`
      : headers['x-filename'] || `lote-${id}.txt`;
    return {
      fileName,
      content: response.data as string,
    };
  },

  getApprovedLoans: async (): Promise<{ data: ApprovedItem[] }> => {
    const response = await apiClient.get('/loan/approved');
    return response.data;
  },

  getApprovedWithdrawals: async (page = 1, limit = 50) => {
    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate/approved?page=${page}&limit=${limit}`,
    );
    return response.data as PaginatedResponse<ApprovedItem>;
  },

  getApprovedLiquidations: async (page = 1, limit = 50) => {
    const response = await apiClient.get(
      `/savings-banks/settlement-associate/approved?page=${page}&limit=${limit}`,
    );
    return response.data as PaginatedResponse<ApprovedItem>;
  },
};
