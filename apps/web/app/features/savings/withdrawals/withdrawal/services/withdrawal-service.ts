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
      `/savings-banks/withdrawal-associate/request/${cedula}`,
    );
    return withdrawalAssociate.parse(response.data);
  },

  getWithdrawalTypes: async () => {
    const response = await apiClient.get('/savings-banks/withdrawal-types');
    const raw = response.data;
    const result = Array.isArray(raw)
      ? raw
      : (raw?.data ?? []);
    return {
      data: withdrawalTypeApiResponseSchema.shape.data.parse(result),
    };
  },

  getWithdrawals: async (params: Record<string, any>) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });

    if (params.search) searchParams.set('search', params.search);
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate?${searchParams.toString()}`,
    );
    const result = withdrawalApiResponseSchema.parse(response.data);

    return {
      data: result.data || [],
      meta: result.meta || {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
    };
  },

  getWithdrawalById: async (id: string) => {
    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate/${id}/details`,
    );
    return response.data;
  },

  createWithdrawal: async (withdrawal: Withdrawal) => {
    const payload = {
      associateAccountId: withdrawal.associateAccountId,
      withdrawalTypeId: withdrawal.withdrawalTypeId,
      requestedAmount: withdrawal.requestedAmount,
      paymentMethod: withdrawal.paymentMethod,
      date: withdrawal.date,
      description: withdrawal.description,
      commercialHouseId: withdrawal.commercialHouseId ?? null,
      withdrawalItems: withdrawal.withdrawalItems ?? [],
    };

    const response = await apiClient.post(
      '/savings-banks/withdrawal-associate',
      payload,
    );
    return withdrawalMutationSchema.parse(response.data);
  },

  approveWithdrawal: async (id: string) => {
    const response = await apiClient.patch(
      `/savings-banks/withdrawal-associate/${id}/approve`,
    );
    return withdrawalMutationSchema.parse(response.data);
  },

  deleteWithdrawal: async (id: string) => {
    const response = await apiClient.delete(
      `/savings-banks/withdrawal-associate/${id}`,
    );
    return withdrawalMutationSchema.parse(response.data);
  },

  disburseWithdrawal: async (
    id: string,
    payload: {
      bankAccountId: string;
      processedAt: Date;
      bankReference?: string;
    },
  ) => {
    const response = await apiClient.patch(
      `/savings-banks/withdrawal-associate/${id}/disburse`,
      {
        bankAccountId: payload.bankAccountId,
        processedAt: payload.processedAt.toISOString(),
        bankReference: payload.bankReference,
      },
    );
    return withdrawalMutationSchema.parse(response.data);
  },

  processWithdrawal: async (id: string) => {
    const response = await apiClient.patch(
      `/savings-banks/withdrawal-associate/${id}/process`,
    );
    return withdrawalMutationSchema.parse(response.data);
  },

  saveWithdrawal: async (withdrawal: Withdrawal) => {
    return await withdrawalService.createWithdrawal(withdrawal);
  },
};
