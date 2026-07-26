import { apiClient } from '@/lib/api-client';
import type {
  BankReconciliationForm,
  BankMovementManualForm,
  ExcelUploadForm,
} from '../schemas/bank-reconciliation.schema';

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
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${buildQueryParams(params)}`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: BankReconciliationForm) => {
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

  addManualMovement: async (
    reconciliationId: string,
    payload: BankMovementManualForm,
  ) => {
    const response = await apiClient.post(
      `${BASE_URL}/${reconciliationId}/manual-movement`,
      payload,
    );
    return response.data;
  },

  addBulkMovements: async (
    reconciliationId: string,
    movementIds: string[],
  ) => {
    const response = await apiClient.post(
      `${BASE_URL}/${reconciliationId}/bulk-movements`,
      { movementIds },
    );
    return response.data;
  },

  getAvailableTransactions: async (reconciliationId: string) => {
    const response = await apiClient.get(
      `${BASE_URL}/${reconciliationId}/available-transactions`,
    );
    return response.data;
  },

  uploadExcel: async (formData: FormData) => {
    const response = await apiClient.post(
      `${BASE_URL}/upload-excel`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  },
};
