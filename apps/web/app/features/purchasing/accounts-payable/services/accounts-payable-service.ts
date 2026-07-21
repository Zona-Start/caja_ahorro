import { apiClient } from '@/lib/api-client';
import {
  accountsPayableListResponseSchema,
  accountsPayableResponseSchema,
  appliedTransactionsListResponseSchema,
} from '../schemas/accounts-payable-api.schema';
import type {
  AccountsPayableApi,
  AppliedTransactionsListResponse,
} from '../schemas/accounts-payable-api.schema';

export interface AccountsPayableQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
}

export interface AccountsPayablePaginatedResponse {
  data: AccountsPayableApi[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
    nextPage?: number | null;
    previousPage?: number | null;
  };
}

const buildQueryParams = (params: AccountsPayableQueryParams): string => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.supplierId) query.set('supplierId', String(params.supplierId));
  return query.toString();
};

export const accountsPayableService = {
  getAll: async (
    params: AccountsPayableQueryParams,
  ): Promise<AccountsPayablePaginatedResponse> => {
    const response = await apiClient.get(
      `/purchasing/accounts-payable/paginated?${buildQueryParams(params)}`,
    );
    const parsed = accountsPayableListResponseSchema.parse(response.data);

    return {
      data: parsed.data,
      meta: parsed.meta,
    };
  },

  getById: async (id: string): Promise<AccountsPayableApi> => {
    const response = await apiClient.get(
      `/purchasing/accounts-payable/${id}`,
    );
    return accountsPayableResponseSchema.parse(response.data).data;
  },

  getAppliedTransactions: async (
    id: string,
  ): Promise<AppliedTransactionsListResponse> => {
    const response = await apiClient.get(
      `/purchasing/accounts-payable/applied-transactions/${id}`,
    );
    return appliedTransactionsListResponseSchema.parse(response.data);
  },

  authorize: async (id: string): Promise<AccountsPayableApi> => {
    const response = await apiClient.patch(
      `/purchasing/accounts-payable/authorize/${id}`,
    );
    return accountsPayableResponseSchema.parse(response.data).data;
  },
};
