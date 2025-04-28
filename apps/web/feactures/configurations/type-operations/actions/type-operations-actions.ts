'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  typeOperationsResponseAllSchema,
  typeOperationsResponseDeleteSchema,
  typeOperationsResponseOneSchema,
} from '../schemas/type-operations-api.schema';
import { TypeOperations } from '../schemas/type-operations.schema';

export const getTypeOperationsAllAction = async () => {
  const [error, data] = await safeFetchApi(
    typeOperationsResponseAllSchema,
    '/core/type-operations',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getTypeOperationsPaginatedAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  group?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.group && { group: params.group }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    typeOperationsResponseAllSchema,
    `/core/type-operations/paginated?${searchParams}`,
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

export const createtypeOperationsAction = async (payload: TypeOperations) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeOperationsResponseOneSchema,
    '/core/type-operations',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updatetypeOperationsAction = async (payload: TypeOperations) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typeOperationsResponseOneSchema,
    `/core/type-operations/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const deleteTypeOperationsAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeOperationsResponseDeleteSchema,
    `/core/type-operations/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const gettypeOperationsByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typeOperationsResponseOneSchema,
    `/core/type-operations/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveTypeOperationsAction = async (payload: TypeOperations) => {
  try {
    if (payload.id) {
      return await updatetypeOperationsAction(payload);
    } else {
      return await createtypeOperationsAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account plan data');
  }
};
