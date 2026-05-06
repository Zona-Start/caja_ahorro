import { apiClient } from '@/lib/api-client';
import {
  accountingCycleListResponseSchema,
  accountingCyclePaginationResponseSchema,
  accountingCycleResponseSchema,
} from '../schemas/accounting-cycle-api';
import { CycleStatusEnum } from '../schemas/accounting-cycle-options';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

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
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(
      `/accounting-cycles/paginated?${searchParams.toString()}`,
    );
    const parsed = accountingCyclePaginationResponseSchema.parse(response.data);

    const toLocalDate = (iso: string): Date => {
      const [y, m, d] = iso
        .slice(0, 10)
        .split('-')
        .map((n) => Number(n)) as [number, number, number];
      return new Date(y, m - 1, d);
    };

    const transform = parsed.data.map((item: any) => ({
      ...item,
      status: item.status as CycleStatusEnum,
      startDate: toLocalDate(item.startDate),
      endDate: toLocalDate(item.endDate),
      closedAt: item.closedAt ? toLocalDate(item.closedAt) : null,
    }));

    return {
      data: transform,
      meta: parsed.meta,
    };
  }

  static async getById(id: number) {
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
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(
      `/accounting-cycles/${id}`,
      payloadWithoutId,
    );
    return accountingCycleResponseSchema.parse(response.data).data;
  }

  static async close(id: number) {
    const response = await apiClient.patch(`/accounting-cycles/${id}/close`);
    return accountingCycleResponseSchema.parse(response.data).data;
  }
}
