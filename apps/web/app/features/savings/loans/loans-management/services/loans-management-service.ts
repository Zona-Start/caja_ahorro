import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import {
  SearchAssociateResultSchema,
  LoanManagementMutationResponse,
} from '../schemas/loans-management-api-response';
import type { SearchAssociateResult } from '../schemas/loans-management-api-response';

const loansManagementResponseAllSchema = z.object({
  data: z.array(z.any()),
  meta: z.object({
    totalItems: z.coerce.number(),
    itemCount: z.coerce.number(),
    itemsPerPage: z.coerce.number(),
    totalPages: z.coerce.number(),
    currentPage: z.coerce.number(),
  }),
});

export const loansManagementService = {
  searchAssociate: async (cedula: string): Promise<SearchAssociateResult> => {
    const response = await apiClient.get(`/loan/search-associate/${cedula}`);
    return SearchAssociateResultSchema.parse(response.data);
  },

  getLoansManagementAll: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    modality?: string;
    search?: string;
    sortBy?: string;
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
      ...(params.status && { status: params.status }),
      ...(params.type && { type: params.type }),
      ...(params.modality && { modality: params.modality }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });

    const response = await apiClient.get(`/loan?${searchParams}`);

    const result = loansManagementResponseAllSchema.parse(response.data);

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

  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/loan/request/${cedula}`);
    return response.data;
  },

  createLoansManagement: async (payload: unknown) => {
    const response = await apiClient.post('/loan/request', payload);
    return LoanManagementMutationResponse.parse(response.data);
  },

  approveLoansManagement: async (id: string) => {
    const response = await apiClient.patch(`/loan/approve/${id}`);
    return response.data;
  },

  disburseLoan: async (id: string, payload: any) => {
    const { loanId, ...body } = payload;
    const response = await apiClient.post(`/loan/disburse/${id}`, body);
    return response.data;
  },

  deleteLoansManagement: async (id: string) => {
    const response = await apiClient.delete(`/loan/${id}`);
    return response.data;
  },

  getLoansManagementAllCount: async () => {
    const response = await apiClient.get('/loan/count');
    return response.data;
  },

  getLoansManagementById: async (id: number) => {
    const response = await apiClient.get(`/loan/request/byEdit/${id}`);
    return response.data;
  },

  getLoanDetails: async (id: string) => {
    const response = await apiClient.get(`/loan/${id}/details`);
    return response.data;
  },
};
