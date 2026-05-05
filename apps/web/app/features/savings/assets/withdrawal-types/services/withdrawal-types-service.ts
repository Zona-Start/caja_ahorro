import { apiClient } from '@/lib/api-client';
import {
  type WithdrawalTypesSchemaAPI,
  withdrawalTypesAllResponseSchema,
  withdrawalTypesMutationResponseSchema,
} from '../schemas/withdrawal-types-api.schema';
import { type WithdrawalTypes } from '../schemas/withdrawal-types.schema';

export const withdrawalTypesService = {
  getWithdrawalTypes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });

    const response = await apiClient.get(
      `/savings-banks/withdrawal-types/paginated?${searchParams.toString()}`
    );
    const result = withdrawalTypesAllResponseSchema.parse(response.data);

    const parsedData =
      result.data.map((item) => ({
        ...item,
        withdrawalLimitQuantity:
          item.withdrawalLimitQuantity !== undefined &&
          item.withdrawalLimitQuantity !== null
            ? Number(item.withdrawalLimitQuantity)
            : undefined,
        minimumAntiquityDays:
          item.minimumAntiquityDays !== undefined &&
          item.minimumAntiquityDays !== null
            ? Number(item.minimumAntiquityDays)
            : undefined,
        withdrawalFrequencyRelation:
          Number(item.withdrawalFrequencyRelation) ?? 0,
      })) || [];

    return {
      data: parsedData,
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

  createWithdrawalType: async (payload: WithdrawalTypes) => {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.post(
      '/savings-banks/withdrawal-types',
      payloadWithoutId
    );
    return withdrawalTypesMutationResponseSchema.parse(response.data);
  },

  updateWithdrawalType: async (payload: WithdrawalTypes) => {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(
      `/savings-banks/withdrawal-types/${id}`,
      payloadWithoutId
    );
    return withdrawalTypesMutationResponseSchema.parse(response.data);
  },

  deleteWithdrawalType: async (id: number) => {
    const response = await apiClient.delete(
      `/savings-banks/withdrawal-types/${id}`
    );
    return withdrawalTypesMutationResponseSchema.parse(response.data);
  },

  saveWithdrawalType: async (payload: WithdrawalTypes) => {
    if (payload.id) {
      return await withdrawalTypesService.updateWithdrawalType(payload);
    } else {
      return await withdrawalTypesService.createWithdrawalType(payload);
    }
  },
};
