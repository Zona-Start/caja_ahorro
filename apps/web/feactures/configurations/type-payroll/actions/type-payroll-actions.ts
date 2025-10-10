'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  typePayrollResponseAllSchema,
  typePayrollResponseDeleteSchema,
  typePayrollResponseOneSchema,
} from '../schemas/type-payroll-api.schema';
import { TypePayrolls } from '../schemas/type-payroll.schema';

export const getTypePayrollAllAction = async () => {
  const [error, data] = await safeFetchApi(
    typePayrollResponseAllSchema,
    '/core/type-payroll',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getTypePayrollPaginatedAction = async (params: {
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
    typePayrollResponseAllSchema,
    `/core/type-payroll/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  const trasnform = response?.data.map((item: any) => {
    return {
      ...item,
      deferredDate: item.deferredDate
        ? new Date(item.deferredDate)
        : new Date(),
    };
  });

  return {
    data: trasnform,
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

export const createTypePayrollAction = async (payload: TypePayrolls) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typePayrollResponseOneSchema,
    '/core/type-payroll',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updateTypePayrollAction = async (payload: TypePayrolls) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    typePayrollResponseOneSchema,
    `/core/type-payroll/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const deleteTypePayrollAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typePayrollResponseDeleteSchema,
    `/core/type-payroll/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getTypePayrollByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    typePayrollResponseOneSchema,
    `/core/type-payroll/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveTypePayrollAction = async (payload: TypePayrolls) => {
  try {
    if (payload.id) {
      return await updateTypePayrollAction(payload);
    } else {
      return await createTypePayrollAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account plan data');
  }
};
