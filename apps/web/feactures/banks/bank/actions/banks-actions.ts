'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  Banks,
  banksDeleteResponseSchema,
  banksListResponseSchema,
  banksPaginationResponseSchema,
  banksResponseSchema,
} from '../schemas/banks.schema';

export const getBanksAction = async () => {
  const [error, data] = await safeFetchApi(
    banksListResponseSchema,
    '/banks',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }
  return data;
};

export const getPaginatedBanksAction = async (params: {
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
    banksPaginationResponseSchema,
    `/banks/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
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

export const createBankAction = async (payload: Banks) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    banksResponseSchema,
    '/banks',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateBankAction = async (payload: Banks) => {
  const { id, ...payloadWithoutId } = payload;
  console.log(`/banks/${id}`);
  const [error, data] = await safeFetchApi(
    banksResponseSchema,
    `/banks/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const deleteBankAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    banksDeleteResponseSchema,
    `/banks/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getBankByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    banksResponseSchema,
    `/banks/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const saveBankAction = async (payload: Banks) => {
  try {
    if (payload.id) {
      return await updateBankAction(payload);
    } else {
      return await createBankAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving bank data');
  }
};
