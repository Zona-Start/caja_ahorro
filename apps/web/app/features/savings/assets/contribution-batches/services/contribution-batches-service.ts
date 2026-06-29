import { apiClient } from '@/lib/api-client';
import {
  contributionBatchListResponseSchema,
  contributionBatchDetailResponseSchema,
  reverseBatchResponseSchema,
} from '../schemas/contribution-batches.schema';

export const contributionBatchesService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.type) searchParams.set('type', params.type);
    if (params.movementType) searchParams.set('movementType', params.movementType);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await apiClient.get(
      `/savings-banks/contribution-batches?${searchParams}`,
    );
    return contributionBatchListResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(
      `/savings-banks/contribution-batches/${id}`,
    );
    return contributionBatchDetailResponseSchema.parse(response.data);
  },

  reverse: async (id: string) => {
    const response = await apiClient.post(
      `/savings-banks/contribution-batches/${id}/reverse`,
    );
    return reverseBatchResponseSchema.parse(response.data);
  },
};
