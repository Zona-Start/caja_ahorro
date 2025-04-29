'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  typeLoanAllResponseSchema,
  typeLoanApiResponseSchema,
  typeLoanDeleteResponseSchema,
} from '../schemas/type-loans-api.schema';
import { TypeLoan } from '../schemas/type-loans.schema';

export const getTypeLoansAction = async () => {
  const [error, data] = await safeFetchApi(
    typeLoanAllResponseSchema,
    '/savings-banks/loan-types',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return {
    data: data?.data,
  };
};

export const getPaginatedTypeLoansAction = async (params: {
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
    typeLoanAllResponseSchema,
    `/savings-banks/loan-types/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

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

export const createTypeLoansAction = async (payload: TypeLoan) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeLoanApiResponseSchema,
    '/savings-banks/loan-types',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updateTypeLoansAction = async (payload: TypeLoan) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeLoanApiResponseSchema,
    `/savings-banks/loan-types/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const deleteTypeLoansAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeLoanDeleteResponseSchema,
    `/savings-banks/loan-types/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getTypeLoansByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeLoanApiResponseSchema,
    `/savings-banks/loan-types/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveTypeLoansAction = async (payload: TypeLoan) => {
  try {
    if (payload.id) {
      return await updateTypeLoansAction(payload);
    } else {
      return await createTypeLoansAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account plan data');
  }
};
