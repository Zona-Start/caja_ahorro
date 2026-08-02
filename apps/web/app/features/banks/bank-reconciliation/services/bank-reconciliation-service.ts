import { apiClient } from '@/lib/api-client';

const BASE_URL = '/bakings/bank-reconciliations';

export interface BankReconciliationQueryParams {
  page?: number;
  limit?: number;
  bankAccountId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryParams = (params: BankReconciliationQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.bankAccountId) query.set('bankAccountId', params.bankAccountId);
  if (params.status) query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  return query.toString();
};

export const bankReconciliationService = {
  getAllPaginated: async (params: BankReconciliationQueryParams) => {
    const response = await apiClient.get(`${BASE_URL}/paginated?${buildQueryParams(params)}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: {
    bankAccountId: string;
    startDate: Date;
    statementDate: Date;
    statementEndingBalance: number;
    notes?: string | null;
  }) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  processAndComplete: async (id: string) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/process`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/cancel`);
    return response.data;
  },

  addStatementLine: async (reconciliationId: string, payload: {
    transactionDate: Date;
    bankReference?: string | null;
    description: string;
    isCredit: boolean;
    amount: number;
  }) => {
    const response = await apiClient.post(`${BASE_URL}/${reconciliationId}/statement-line`, payload);
    return response.data;
  },

  getStatementLines: async (reconciliationId: string) => {
    const response = await apiClient.get(`${BASE_URL}/${reconciliationId}/statement-lines`);
    return response.data;
  },

  getBookTransactions: async (reconciliationId: string) => {
    const response = await apiClient.get(`${BASE_URL}/${reconciliationId}/book-transactions`);
    return response.data;
  },

  autoMatch: async (reconciliationId: string) => {
    const response = await apiClient.post(`${BASE_URL}/${reconciliationId}/auto-match`);
    return response.data;
  },

  manualMatch: async (reconciliationId: string, payload: {
    statementLineIds: string[];
    bankTransactionIds: string[];
  }) => {
    const response = await apiClient.post(`${BASE_URL}/${reconciliationId}/manual-match`, payload);
    return response.data;
  },

  generateBookEntry: async (reconciliationId: string, payload: {
    statementLineId: string;
    description?: string;
  }) => {
    const response = await apiClient.post(`${BASE_URL}/${reconciliationId}/generate-book-entry`, payload);
    return response.data;
  },

  unmatchLine: async (reconciliationId: string, lineId: string) => {
    const response = await apiClient.post(`${BASE_URL}/${reconciliationId}/unmatch-line/${lineId}`);
    return response.data;
  },

  uploadExcel: async (formData: FormData) => {
    const response = await apiClient.post(`${BASE_URL}/upload-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
