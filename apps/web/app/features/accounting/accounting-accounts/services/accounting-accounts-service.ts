import { apiClient } from '@/lib/api-client';
import {
  accountPlanListApiResponseSchema,
} from '../schemas/account-plan-api';
import {
  type AccountPlan,
  accountPlanDeleteResponseSchema,
  accountPlanResponseSchema,
} from '../schemas/account-plan.schema';

export class AccountingAccountsService {
  static async getAll() {
    const response = await apiClient.get('/account-plan/all');
    return accountPlanListApiResponseSchema.parse(response.data).data;
  }

  static async getPaginated(params: {
    page?: number;
    limit?: number;
    level?: string;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    let searchType = '';
    let searchValue = '';

    if (params.search) {
      if (/^\d/.test(params.search)) {
        searchType = 'code';
      } else {
        searchType = 'name';
      }
      searchValue = params.search.toUpperCase();
    }

    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (searchType) searchParams.append('searchType', searchType);
    if (searchValue) searchParams.append('search', searchValue);
    if (params.type) searchParams.append('type', params.type);
    if (params.level) searchParams.append('level', params.level);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/account-plan/pagination?${searchParams.toString()}`);
    const parsed = accountPlanListApiResponseSchema.parse(response.data);
    return {
      data: parsed.data,
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

  static async create(payload: AccountPlan) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.post('/account-plan', payloadWithoutId);
    return accountPlanResponseSchema.parse(response.data);
  }

  static async update(payload: AccountPlan) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(`/account-plan/${id}`, payloadWithoutId);
    return accountPlanResponseSchema.parse(response.data);
  }

  static async delete(id: number) {
    const response = await apiClient.delete(`/account-plan/${id}`);
    return accountPlanDeleteResponseSchema.parse(response.data);
  }

  static async getById(id: number) {
    const response = await apiClient.get(`/account-plan/${id}`);
    return accountPlanResponseSchema.parse(response.data);
  }

  static async save(payload: AccountPlan) {
    if (payload.id) {
      return this.update(payload);
    } else {
      return this.create(payload);
    }
  }
}
