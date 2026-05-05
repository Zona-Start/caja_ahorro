import { apiClient } from '@/lib/api-client';
import {
  associateDetailsResponseSchema,
  creditDetailsResponseSchema,
  creditsResponseSchema,
  haberesMovementsResponseSchema,
  loanDetailsResponseSchema,
  loansResponseSchema,
  transactionHistoryResponseSchema,
  withdrawalDetailsResponseSchema,
  withdrawalsResponseSchema,
} from '../schemas/inquiry-schema';

export const inquiryService = {
  getAssociateDetails: async (cedula: string) => {
    const response = await apiClient.get(`/savings-banks/associates/details/${cedula}`);
    return associateDetailsResponseSchema.parse(response.data);
  },

  getHaberesMovements: async (params: {
    associateId: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    const response = await apiClient.get(
      `/savings-banks/associate-accounts-movements/haberes/by-associate/${params.associateId}?${searchParams}`
    );
    return haberesMovementsResponseSchema.parse(response.data);
  },

  getWithdrawals: async (params: {
    associateId: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate/by-associate/${params.associateId}?${searchParams}`
    );
    return withdrawalsResponseSchema.parse(response.data);
  },

  getTransactionHistory: async (params: {
    associateId: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    const response = await apiClient.get(
      `/savings-banks/associate-accounts-movements/history/by-associate/${params.associateId}?${searchParams}`
    );
    return transactionHistoryResponseSchema.parse(response.data);
  },

  getLoans: async (params: {
    associateId: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    const response = await apiClient.get(
      `/loan/by-associate/${params.associateId}?${searchParams}`
    );
    return loansResponseSchema.parse(response.data);
  },

  getCredits: async (params: {
    associateId: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    const response = await apiClient.get(
      `/credit/by-associate/${params.associateId}?${searchParams}`
    );
    return creditsResponseSchema.parse(response.data);
  },

  getWithdrawalDetails: async (withdrawalId: number) => {
    const response = await apiClient.get(`/savings-banks/withdrawal-associate/${withdrawalId}/details`);
    return withdrawalDetailsResponseSchema.parse(response.data);
  },

  getCreditDetails: async (creditId: number) => {
    const response = await apiClient.get(`/credit/${creditId}/details`);
    return creditDetailsResponseSchema.parse(response.data);
  },

  getLoanDetails: async (loanId: number) => {
    const response = await apiClient.get(`/loan/${loanId}/details`);
    return loanDetailsResponseSchema.parse(response.data);
  },
};
