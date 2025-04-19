'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  AssociatesByIdResponseSchema,
  AssociatesDeleteResponseSchema,
  AssociatesMutate,
  AssociatesMutateResponseSchema,
  AssociatesResponseSchema,
} from '../schemas/associates.schema';

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
    AssociatesResponseSchema,
    `/associates?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
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
    salaryTotal: Number(associatesMutate.salaryTotal),
    discountFrequencyId: String(associatesMutate.discountFrequencyId),
    dateAdmission: associatesMutate.dateAdmission.toISOString().split('T')[0],
    dateGraduation: associatesMutate.dateGraduation
      ?.toISOString()
      .split('T')[0],
    birthdate: associatesMutate.birthdate.toISOString().split('T')[0],
    isPayrollCredit: Boolean(associatesMutate.isPayrollCredit),
  };

  const [error, data] = await safeFetchApi(
    AssociatesMutateResponseSchema,
    '/associates',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateAssociatesAction = async (
  associatesMutate: AssociatesMutate,
) => {
  const { id, ...payloadWithoutId } = associatesMutate;

  const payload = {
    ...payloadWithoutId,
    salaryTotal: Number(associatesMutate.salaryTotal),
    discountFrequencyId: String(associatesMutate.discountFrequencyId),
    dateAdmission: associatesMutate.dateAdmission.toISOString().split('T')[0],
    dateGraduation: associatesMutate.dateGraduation
      ?.toISOString()
      .split('T')[0],
    birthdate: associatesMutate.birthdate.toISOString().split('T')[0],
    isPayrollCredit: Boolean(associatesMutate.isPayrollCredit),
  };
  const [error, data] = await safeFetchApi(
    AssociatesMutateResponseSchema,
    `/associates/${id}`,
    'PATCH',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const deleteAssociatesAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    AssociatesDeleteResponseSchema,
    `/associates/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getAssociatesByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    AssociatesByIdResponseSchema,
    `/associates/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
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
