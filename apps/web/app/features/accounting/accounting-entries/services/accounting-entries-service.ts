import { apiClient } from '@/lib/api-client';
import {
  accountingEntryDeleteResponseSchema,
  accountingEntryPaginationResponseSchema,
  accountingEntryResponseSchema,
} from '../schemas/accounting-entry-api';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';

export class AccountingEntriesService {
  static async getPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    accountingCycleId?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.accountingCycleId) searchParams.append('accountingCycleId', params.accountingCycleId.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/accounting-entries?${searchParams.toString()}`);
    const parsed = accountingEntryPaginationResponseSchema.parse(response.data);

    const transform = parsed.data.map((item: any) => ({
      ...item,
      entryDate: new Date(item.entryDate),
    }));

    return {
      data: transform,
      meta: parsed.meta,
    };
  }

  static async getById(id: number) {
    const response = await apiClient.get(`/accounting-entries/${id}`);
    const parsed = accountingEntryResponseSchema.parse(response.data);
    return {
      ...parsed.data,
      entryDate: new Date(parsed.data.entryDate),
    };
  }

  static async create(payload: AccountingEntry) {
    const response = await apiClient.post('/accounting-entries', payload);
    return accountingEntryResponseSchema.parse(response.data).data;
  }

  static async update(payload: AccountingEntry) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(`/accounting-entries/${id}`, payloadWithoutId);
    return accountingEntryResponseSchema.parse(response.data).data;
  }

  static async delete(id: number) {
    const response = await apiClient.delete(`/accounting-entries/${id}`);
    return accountingEntryDeleteResponseSchema.parse(response.data);
  }

  static async submit(id: number) {
    const response = await apiClient.post(`/accounting-entries/${id}/submit`);
    return accountingEntryResponseSchema.parse(response.data).data;
  }

  static async post(id: number) {
    const response = await apiClient.post(`/accounting-entries/${id}/post`);
    return accountingEntryResponseSchema.parse(response.data).data;
  }

  static async cancel(id: number) {
    const response = await apiClient.post(`/accounting-entries/${id}/cancel`);
    return accountingEntryResponseSchema.parse(response.data).data;
  }
}
