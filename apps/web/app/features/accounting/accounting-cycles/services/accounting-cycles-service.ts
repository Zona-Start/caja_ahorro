import { apiClient } from '@/lib/api-client';
import {
  accountingCycleDeleteResponseSchema,
  accountingCycleListResponseSchema,
  accountingCyclePaginationResponseSchema,
  accountingCycleResponseSchema,
} from '../schemas/accounting-cycle-api';
import { CycleStatusEnum } from '../schemas/accounting-cycle-options';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export class AccountingCyclesService {
  static async getAll() {
    const response = await apiClient.get('/accounting-cycles');
    return accountingCycleListResponseSchema.parse(response.data).data;
  }

  static async getPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: AccountingCycle[]; meta: PaginationMeta }> {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(
      `/accounting-cycles/paginated?${searchParams.toString()}`,
    );
    const parsed = accountingCyclePaginationResponseSchema.parse(response.data);

    const toLocalString = (value: unknown): string => {
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      if (typeof value === 'string') {
        return value.slice(0, 10);
      }
      return '';
    };

    const transform = parsed.data.map((item) => ({
      ...item,
      status: item.status as CycleStatusEnum,
      startDate: toLocalString(item.startDate),
      endDate: toLocalString(item.endDate),
    })) as AccountingCycle[];

    return {
      data: transform,
      meta: parsed.meta,
    };
  }

  static async getById(id: string) {
    const response = await apiClient.get(`/accounting-cycles/${id}`);
    return accountingCycleResponseSchema.parse(response.data).data;
  }

  static async create(payload: AccountingCycle) {
    const { id, status, ...payloadWithoutId } = payload;
    const response = await apiClient.post(
      '/accounting-cycles',
      payloadWithoutId,
    );
    return accountingCycleResponseSchema.parse(response.data).data;
  }

  static async update(payload: AccountingCycle) {
    const { id, status, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(
      `/accounting-cycles/${id}`,
      payloadWithoutId,
    );
    return accountingCycleResponseSchema.parse(response.data).data;
  }

  static async changeStatus(id: string, status: string) {
    const response = await apiClient.patch(
      `/accounting-cycles/${id}/status`,
      { status },
    );
    return accountingCycleResponseSchema.parse(response.data).data;
  }

  static async delete(id: string) {
    const response = await apiClient.delete(`/accounting-cycles/${id}`);
    return accountingCycleDeleteResponseSchema.parse(response.data);
  }
}
