import { apiClient } from '@/lib/api-client';
import {
  statementResponseSchema,
  haberesPaginatedResponseSchema,
  withdrawalsPaginatedResponseSchema,
  loansPaginatedResponseSchema,
  creditsPaginatedResponseSchema,
  historyPaginatedResponseSchema,
  loanDetailResponseSchema,
  creditDetailResponseSchema,
  withdrawalDetailResponseSchema,
} from '../schemas/inquiry-schema';

const BASE = '/savings-banks/associates/inquiry';

export const inquiryService = {
  getStatement: async (cedula: string) => {
    const response = await apiClient.get(`${BASE}/statement`, {
      params: { cedula },
    });
    return statementResponseSchema.parse(response.data);
  },

  getHaberes: async (associateId: string, params: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`${BASE}/haberes/${associateId}`, {
      params: { page: params.page || 1, limit: params.limit || 10 },
    });
    return haberesPaginatedResponseSchema.parse(response.data);
  },

  getRetiros: async (associateId: string, params: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`${BASE}/retiros/${associateId}`, {
      params: { page: params.page || 1, limit: params.limit || 10 },
    });
    return withdrawalsPaginatedResponseSchema.parse(response.data);
  },

  getPrestamos: async (associateId: string, params: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`${BASE}/prestamos/${associateId}`, {
      params: { page: params.page || 1, limit: params.limit || 10 },
    });
    return loansPaginatedResponseSchema.parse(response.data);
  },

  getCreditos: async (associateId: string, params: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`${BASE}/creditos/${associateId}`, {
      params: { page: params.page || 1, limit: params.limit || 10 },
    });
    return creditsPaginatedResponseSchema.parse(response.data);
  },

  getHistorial: async (associateId: string, params: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`${BASE}/historial/${associateId}`, {
      params: { page: params.page || 1, limit: params.limit || 10 },
    });
    return historyPaginatedResponseSchema.parse(response.data);
  },

  getPrestamoDetalle: async (loanId: string) => {
    const response = await apiClient.get(`${BASE}/prestamo/${loanId}/detalle`);
    return loanDetailResponseSchema.parse(response.data.data);
  },

  getCreditoDetalle: async (creditId: string) => {
    const response = await apiClient.get(`${BASE}/credito/${creditId}/detalle`);
    return creditDetailResponseSchema.parse(response.data.data);
  },

  getRetiroDetalle: async (withdrawalId: string) => {
    const response = await apiClient.get(`${BASE}/retiro/${withdrawalId}/detalle`);
    return withdrawalDetailResponseSchema.parse(response.data.data);
  },
};
