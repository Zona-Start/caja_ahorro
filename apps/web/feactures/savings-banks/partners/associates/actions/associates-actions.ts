'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  AssociatesDeleteResponseSchema,
  AssociatesResponseAllSchema,
  AssociatesResponseOneSchema,
} from '../schemas/associates-response-api';
import { AssociatesMutate } from '../schemas/associates.schema';

export const getAssociatesAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  payroll?: string;
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
    ...(params.payroll && { payroll: params.payroll }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    AssociatesResponseAllSchema,
    `/savings-banks/associates?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associates data');
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

export const createAssociateAction = async (
  associatesMutate: AssociatesMutate,
) => {
  const { id, ...payloadWithoutId } = associatesMutate;

  const payload = {
    ...payloadWithoutId,
    birthdate: payloadWithoutId.birthdate.toISOString().split('T')[0],
    dateAdmission: payloadWithoutId.dateAdmission.toISOString().split('T')[0],
    dateGraduation: payloadWithoutId.dateGraduation
      ? payloadWithoutId.dateGraduation.toISOString().split('T')[0]
      : null,
    isPayrollCredit: Boolean(payloadWithoutId.isPayrollCredit),
    baseSalary: Number(payloadWithoutId.baseSalary),
  };

  const [error, data] = await safeFetchApi(
    AssociatesResponseOneSchema,
    '/savings-banks/associates',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create associate');
  }

  return data;
};

export const updateAssociatesAction = async (
  associatesMutate: AssociatesMutate,
) => {
  const { id, ...payloadWithoutId } = associatesMutate;

  const payload = {
    ...payloadWithoutId,
    birthdate: payloadWithoutId.birthdate.toISOString().split('T')[0],
    dateAdmission: payloadWithoutId.dateAdmission.toISOString().split('T')[0],
    dateGraduation: payloadWithoutId.dateGraduation
      ? payloadWithoutId.dateGraduation.toISOString().split('T')[0]
      : null,
    isPayrollCredit: Boolean(payloadWithoutId.isPayrollCredit),
    baseSalary: Number(payloadWithoutId.baseSalary),
  };
  const [error, data] = await safeFetchApi(
    AssociatesResponseOneSchema,
    `/savings-banks/associates/${id}`,
    'PATCH',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update associates');
  }

  return data;
};

export const deleteAssociatesAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    AssociatesDeleteResponseSchema,
    `/savings-banks/associates/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error delete associates');
  }

  return data;
};

export const getAssociatesByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    AssociatesResponseOneSchema,
    `/savings-banks/associates/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const saveAssociateAction = async (
  associatesMutate: AssociatesMutate,
) => {
  try {
    if (associatesMutate.id) {
      return await updateAssociatesAction(associatesMutate);
    } else {
      return await createAssociateAction(associatesMutate);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving associate data');
  }
};
