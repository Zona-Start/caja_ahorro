import { apiClient } from '@/lib/api-client';
import {
  accountingRuleApiResponseSchema,
  accountingRuleDeleteResponseSchema,
  accountingRuleListApiResponseSchema,
} from '../schemas/accounting-rule-api';
import type { AccountingRule } from '../schemas/accounting-rule.schema';

export class AccountingRulesService {
  static async getAll() {
    const response = await apiClient.get(`/accounting-rules`);
    return accountingRuleListApiResponseSchema.parse(response.data).data;
  }

  static async getPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    let searchType = '';
    let searchValue = '';

    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (searchType) searchParams.append('searchType', searchType);
    if (searchValue) searchParams.append('search', searchValue);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    const response = await apiClient.get(
      `/accounting-rules/pagination?${searchParams.toString()}`,
    );
    if (!response.data) {
      return {
        data: [],
        meta: {
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

    let parsed;
    try {
      parsed = accountingRuleListApiResponseSchema.parse(response.data);
    } catch (parseError) {
      return {
        data: [],
        meta: {
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

    return {
      data: parsed.data,
      meta: parsed.meta ?? {
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

  static async getById(id: number) {
    const response = await apiClient.get(`/accounting-rules/${id}`);
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async create(payload: AccountingRule) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.post(
      '/accounting-rules',
      payloadWithoutId,
    );
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async update(payload: AccountingRule) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(
      `/accounting-rules/${id}`,
      payloadWithoutId,
    );
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async delete(id: number) {
    const response = await apiClient.delete(`/accounting-rules/${id}`);
    return accountingRuleDeleteResponseSchema.parse(response.data);
  }
}
