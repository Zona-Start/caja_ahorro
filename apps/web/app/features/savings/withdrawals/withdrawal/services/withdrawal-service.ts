import { apiClient } from '@/lib/api-client';
import {
  withdrawalAssociate,
  type AssociatesWithdrawal,
} from '../schemas/individual-withdrawal-api-schema';
import {
  withdrawalApiResponseSchema,
  withdrawalMutationSchema,
  withdrawalTypeApiResponseSchema,
} from '../schemas/withdrawal-api-response';
import { type Withdrawal } from '../schemas/withdrawal.schema';

export const withdrawalService = {
  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate/request/${cedula}`
    );
    return withdrawalAssociate.parse(response.data);
  },

  getWithdrawalTypes: async () => {
    const response = await apiClient.get('/savings-banks/associate-withdrawal-types');
    const result = withdrawalTypeApiResponseSchema.parse(response.data);
    return {
      data: result.data || [],
    };
  },

  getWithdrawals: async (params: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    status?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    let searchType = '';
    let searchValue = '';

    if (params.search) {
      if (/^\d/.test(params.search)) {
        searchType = 'cedula';
      } else {
        searchType = 'fullname';
      }
      searchValue = params.search.toUpperCase();
    }

    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(searchType && { searchType }),
      ...(searchValue && { search: searchValue }),
      ...(params.type && { type: params.type }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.status && { status: params.status }),
    });

    const response = await apiClient.get(`/savings-banks/withdrawal-associate?${searchParams.toString()}`);
    const result = withdrawalApiResponseSchema.parse(response.data);

    const tableData =
      result.data.map((item) => ({
        ...item,
        withdrawalDate: item.withdrawalDate.split('T')[0],
      })) || [];

    return {
      data: tableData,
      meta: result.meta || {
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
  },

  createWithdrawal: async (withdrawal: Withdrawal) => {
    const { id, ...payloadWithoutId } = withdrawal;
    const payload = {
      ...payloadWithoutId,
      requestedAmount: Number(payloadWithoutId.requestedAmount),
      withdrawalDate: payloadWithoutId.withdrawalDate.toISOString().split('T')[0],
    };

    const response = await apiClient.post('/savings-banks/withdrawal-associate', payload);
    return withdrawalMutationSchema.parse(response.data);
  },

  approveWithdrawal: async (id: number) => {
    const response = await apiClient.patch(`/savings-banks/withdrawal-associate/${id}/approve`);
    return withdrawalMutationSchema.parse(response.data);
  },

  deleteWithdrawal: async (id: number) => {
    const response = await apiClient.delete(`/savings-banks/withdrawal-associate/${id}`);
    return withdrawalMutationSchema.parse(response.data);
  },

  disburseWithdrawal: async (id: number, payload: any) => {
    const response = await apiClient.patch(`/savings-banks/withdrawal-associate/${id}/disburse`, {
      ...payload,
      processedAt: payload.processedAt.toISOString(),
    });
    return withdrawalMutationSchema.parse(response.data);
  },

  processWithdrawal: async (id: number) => {
    const response = await apiClient.patch(`/savings-banks/withdrawal-associate/${id}/process`);
    return withdrawalMutationSchema.parse(response.data);
  },

  saveWithdrawal: async (withdrawal: Withdrawal) => {
    return await withdrawalService.createWithdrawal(withdrawal);
  },
};
