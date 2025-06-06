'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  typeCreditAllResponseSchema,
  typeCreditApiResponseSchema,
  typeCreditDeleteResponseSchema,
} from '../schemas/type-credits-api.schema';
import { TypeCredit } from '../schemas/type-credits.schema';

export const getTypeCreditsAction = async () => {
  const [error, data] = await safeFetchApi(
    typeCreditAllResponseSchema,
    '/savings-banks/credit-types',
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

export const getPaginatedTypeCreditsAction = async (params: {
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
    typeCreditAllResponseSchema,
    `/savings-banks/credit-types/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  const dataTrasform = response?.data.map((item) => ({
    ...item,
    termUnits: String(item.termUnits),
    specialQuotaNumber: String(item.specialQuotaNumber),
    minimumSeniorityMonths: String(item.minimumSeniorityMonths),
  }));

  return {
    data: dataTrasform,
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

export const createTypeCreditsAction = async (payload: TypeCredit) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeCreditApiResponseSchema,
    '/savings-banks/credit-types',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updateTypeCreditsAction = async (payload: TypeCredit) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeCreditApiResponseSchema,
    `/savings-banks/credit-types/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const deleteTypeCreditsAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeCreditDeleteResponseSchema,
    `/savings-banks/credit-types/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getTypeCreditsByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeCreditApiResponseSchema,
    `/savings-banks/loan-types/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveTypeCreditsAction = async (payload: TypeCredit) => {
  try {
    if (payload.id) {
      return await updateTypeCreditsAction(payload);
    } else {
      return await createTypeCreditsAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving credit data');
  }
};
