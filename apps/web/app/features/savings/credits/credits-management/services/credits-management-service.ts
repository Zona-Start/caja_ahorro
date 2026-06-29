import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import {
  CreditManagementResponseAllSchema,
  CreditManagementMutationResponse,
  CreditDeleteResponseSchema,
  SearchAssociateResponseSchema,
  AmortizationResponseSchema,
  CreditCountResponseSchema,
  CreditTypeSchema,
  BankAccountSchema,
} from '../schemas/credits-management-api-response';

export const creditManagementService = {
  searchAssociate: async (cedula: string) => {
    const response = await apiClient.get(`/credit/search-associate/${cedula}`);
    return SearchAssociateResponseSchema.parse(response.data);
  },

  calculateAmortization: async (params: {
    amount: number;
    annualRate: number;
    paymentCount: number;
    startDate: string;
    paymentType: string;
    expensesPercentage?: number;
  }) => {
    const searchParams = new URLSearchParams({
      amount: params.amount.toString(),
      annualRate: params.annualRate.toString(),
      paymentCount: params.paymentCount.toString(),
      startDate: params.startDate,
      paymentType: params.paymentType,
      ...(params.expensesPercentage !== undefined && {
        expensesPercentage: params.expensesPercentage.toString(),
      }),
    });
    const response = await apiClient.get(
      `/credit/calculate-amortization?${searchParams}`,
    );
    return AmortizationResponseSchema.parse(response.data);
  },

  listCreditTypes: async () => {
    const response = await apiClient.get('/credit/credit-types');
    return z.array(CreditTypeSchema).parse(response.data);
  },

  listBankAccounts: async () => {
    const response = await apiClient.get('/credit/bank-accounts');
    return z.array(BankAccountSchema).parse(response.data);
  },

  listSuppliers: async () => {
    const response = await apiClient.get('/credit/suppliers');
    return response.data;
  },

  listProducts: async () => {
    const response = await apiClient.get('/credit/products');
    return response.data;
  },

  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/credit/request/${cedula}`);
    return response.data;
  },

  getCreditManagementById: async (id: string) => {
    const response = await apiClient.get(`/credit/by-edit/${id}`);
    return response.data;
  },

  getCreditManagementAll: async (params: {
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

    const response = await apiClient.get(`/credit?${searchParams}`);
    const result = CreditManagementResponseAllSchema.parse(response.data);

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

  createCreditManagement: async (data: unknown) => {
    const response = await apiClient.post('/credit/request', data);
    return CreditManagementMutationResponse.parse(response.data);
  },

  approveCreditManagement: async (id: string) => {
    const response = await apiClient.post(`/credit/approve/${id}`);
    return CreditManagementMutationResponse.parse(response.data);
  },

  deleteCreditManagement: async (id: string) => {
    const response = await apiClient.delete(`/credit/${id}`);
    return CreditDeleteResponseSchema.parse(response.data);
  },

  getCreditManagementAllCount: async () => {
    const response = await apiClient.get('/credit/count');
    return CreditCountResponseSchema.parse(response.data);
  },

  getCreditDetails: async (id: string) => {
    const response = await apiClient.get(`/credit/${id}/details`);
    return response.data;
  },
};


