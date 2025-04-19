'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  TransactionType,
  transactionTypeDeleteResponseSchema,
  transactionTypeListResponseSchema,
  transactionTypePaginatedResponse,
  transactionTypeResponseSchema,
} from '../schemas/transaction-type.schema';

export const getTransactionTypeAction = async () => {
  const [error, data] = await safeFetchApi(
    transactionTypeListResponseSchema,
    '/configurations/transaction-type',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getPaginatedTransactionTypeAction = async (params: {
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

  const [error, response] = await safeFetchApi(
    transactionTypePaginatedResponse,
    `/configurations/transaction-type/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  //const transformedData = await transformAccountPlanData(response?.data || []);

  return {
    data: response?.data,
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

export const createTransactionTypeAction = async (payload: TransactionType) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    transactionTypeResponseSchema,
    '/configurations/transaction-type',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateTransactionTypeAction = async (payload: TransactionType) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    transactionTypeResponseSchema,
    `/configurations/transaction-type/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const deleteTransactionTypeAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    transactionTypeDeleteResponseSchema,
    `/configurations/transaction-type/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getTransactionTypeByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    transactionTypeResponseSchema,
    `/configurations/transaction-type/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const saveTransactionTypeAction = async (payload: TransactionType) => {
  try {
    if (payload.id) {
      return await updateTransactionTypeAction(payload);
    } else {
      return await createTransactionTypeAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account plan data');
  }
};
