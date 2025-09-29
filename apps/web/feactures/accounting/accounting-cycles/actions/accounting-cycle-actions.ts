'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountingCycleListResponseSchema,
  accountingCyclePaginationResponseSchema,
  accountingCycleResponseSchema,
} from '../schemas/accounting-cycle.api.schema';
import { AccountingCycle } from '../schemas/accounting-cycle.schema';

export const getAccountingCyclesAction = async () => {
  const [error, data] = await safeFetchApi(
    accountingCycleListResponseSchema,
    '/accounting-cycles',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching all accounting cycles');
  }

  return data;
};

export const getPaginatedAccountingCyclesAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
    accountingCyclePaginationResponseSchema,
    `/accounting-cycles/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching paginated accounting cycles',
    );
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

export const createAccountingCycleAction = async (payload: AccountingCycle) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingCycleResponseSchema,
    '/accounting-cycles',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating accounting cycle');
  }

  return data;
};

export const updateAccountingCycleAction = async (payload: AccountingCycle) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingCycleResponseSchema,
    `/accounting-cycles/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating accounting cycle');
  }

  return data;
};

export const closeAccountingCycleAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingCycleResponseSchema,
    `/accounting-cycles/${id}/close`,
    'PATCH',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error closing accounting cycle');
  }

  return data;
};

export const getAccountingCycleByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingCycleResponseSchema,
    `/accounting-cycles/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounting cycle');
  }

  return data;
};

export const saveAccountingCycleAction = async (payload: AccountingCycle) => {
  try {
    if (payload.id) {
      return await updateAccountingCycleAction(payload);
    } else {
      return await createAccountingCycleAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving accounting cycle data');
  }
};
