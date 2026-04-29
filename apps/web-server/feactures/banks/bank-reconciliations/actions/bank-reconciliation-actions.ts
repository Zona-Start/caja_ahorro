'use server';

import { safeFetchApi } from '@/lib/fetch.api';
import {
  bankReconciliationResponseOneSchema,
  bankReconciliationResponseAllSchema,
} from '../schemas/bank-reconciliation-response-api';
import {
  BankReconciliation,
  AddReconciliationDetail,
  bankReconciliationAllResponseSchema,
} from '../schemas/bank-reconciliation.schema';
import { z } from 'zod';

export const getBankReconciliationsAction = async (bankAccountId?: number) => {
  const query = bankAccountId ? `?bankAccountId=${bankAccountId}` : '';
  const [error, response] = await safeFetchApi(
    bankReconciliationResponseAllSchema,
    `/bankings/bank-reconciliations${query}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching bank reconciliations');
  }

  return response;
};

export const getBankReconciliationPaginatedAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    bankReconciliationAllResponseSchema,
    `/bankings/bank-reconciliations/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching bank reconciliations data');
  }

  return {
    data: response?.data || [],
    meta: response?.meta || {
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
};

export const getBankReconciliationByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    bankReconciliationResponseOneSchema,
    `/bankings/bank-reconciliations/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching bank reconciliation data');
  }
  return data;
};

export const createBankReconciliationAction = async (
  payload: BankReconciliation,
) => {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    bankReconciliationResponseOneSchema,
    '/bankings/bank-reconciliations',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating bank reconciliation');
  }

  return data;
};

export const addReconciliationDetailAction = async (
  id: number,
  payload: AddReconciliationDetail,
) => {
  const [error, data] = await safeFetchApi(
    bankReconciliationResponseOneSchema,
    `/bankings/bank-reconciliations/${id}/details`,
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error adding detail');
  }
  return data;
};

export const processBankReconciliationAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    z.any(),
    `/bankings/bank-reconciliations/${id}/process`,
    'POST',
    {},
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error processing bank reconciliation');
  }
  return data;
};
