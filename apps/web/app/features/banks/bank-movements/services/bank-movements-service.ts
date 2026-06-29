import { apiClient } from '@/lib/api-client';
import type { BankMovementForm, BankMovement } from '../schemas/bank-movement.schema';
import type { LinkableRecord } from '../schemas/bank-movement-api.schema';

const BASE_URL = '/bankings/bank-movements';

export interface BankMovementsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  bankAccountId?: string;
  paymentMethod?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  reconciliationStatus?: string;
  internalLinkStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryParams = (params: BankMovementsQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.bankAccountId) query.set('bankAccountId', params.bankAccountId);
  if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params.category) query.set('category', params.category);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.reconciliationStatus) query.set('reconciliationStatus', params.reconciliationStatus);
  if (params.internalLinkStatus) query.set('internalLinkStatus', params.internalLinkStatus);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  return query.toString();
};

export const bankMovementsService = {
  getAll: async (params: BankMovementsQueryParams) => {
    const response = await apiClient.get(`${BASE_URL}?${buildQueryParams(params)}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (payload: BankMovementForm) => {
    const response = await apiClient.post(BASE_URL, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<BankMovementForm>) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  createAndReconcile: async (payload: {
    movement: BankMovementForm;
    links?: { internalRecordType: string; internalRecordId: string }[];
  }) => {
    const response = await apiClient.post(`${BASE_URL}/create-and-reconcile`, payload);
    return response.data;
  },

  getLinkables: async (
    category: string,
    params: { page?: number; limit?: number; q?: string; startDate?: string; endDate?: string },
  ): Promise<{ data: LinkableRecord[]; meta: any }> => {
    const query = new URLSearchParams();
    query.set('category', category);
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 20));
    if (params.q) query.set('q', params.q);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    const response = await apiClient.get(`${BASE_URL}/linkables?${query.toString()}`);
    return response.data;
  },

  getLinkInfo: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}/link`);
    return response.data;
  },

  reconcile: async (id: string, payload: { internalRecordType: string; internalRecordId: string }) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/reconcile`, payload);
    return response.data;
  },

  unlink: async (id: string) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}/unlink`);
    return response.data ?? { message: 'Desvinculado correctamente' };
  },

  reverse: async (id: string, payload: { valueDate: string; reason?: string }) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/reverse`, payload);
    return response.data;
  },
};
