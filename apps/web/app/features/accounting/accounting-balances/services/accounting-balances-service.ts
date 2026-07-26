import { apiClient } from '@/lib/api-client';
import {
  accountingBalanceListApiResponseSchema,
  bootstrappingResponseSchema,
  closeCycleResponseSchema,
  openCycleResponseSchema,
} from '../schemas/accounting-balance-api';
import {
  type CloseCycle,
  type InitialLoad,
  type OpenCycle,
} from '../schemas/accounting-balance.schema';

export class AccountingBalancesService {
  static async getPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    accountingCycleId?: string;
    companyId?: string;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.accountingCycleId) searchParams.append('accountingCycleId', params.accountingCycleId);
    if (params.companyId) searchParams.append('companyId', params.companyId);

    const response = await apiClient.get(`/accounting-balance?${searchParams.toString()}`);
    const parsed = accountingBalanceListApiResponseSchema.parse(response.data);
    
    return {
      data: parsed.data || [],
      meta: parsed.meta || {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    };
  }

  static async bootstrapping(payload: InitialLoad) {
    const response = await apiClient.post('/accounting-balance/bootstrapping', payload);
    return bootstrappingResponseSchema.parse(response.data);
  }

  static async bootstrappingWithFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/accounting-balance/bootstrapping', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return bootstrappingResponseSchema.parse(response.data);
  }

  static async closeCycle(cycleId: string, payload: CloseCycle) {
    const response = await apiClient.post(`/accounting-balance/close/${cycleId}`, payload);
    return closeCycleResponseSchema.parse(response.data);
  }

  static async openCycle(payload: OpenCycle) {
    const response = await apiClient.post('/accounting-balance/open', payload);
    return openCycleResponseSchema.parse(response.data);
  }
}
