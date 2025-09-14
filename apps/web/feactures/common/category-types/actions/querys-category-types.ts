'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  categoryTypesListResponseSchema,
  categoryTypesPaginationResponseSchema,
  categoryTypesResponseSchema,
} from '../schemas/category-types-response';
import { GROUP_TYPES } from '../schemas/group-options';

export const getCategoryTypesAction = async () => {
  const [error, data] = await safeFetchApi(
    categoryTypesListResponseSchema,
    '/core/category-types',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }
  return data;
};

export const getPaginatedCategoryTypesAction = async (params: {
  page?: number;
  limit?: number;
  group?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
    categoryTypesPaginationResponseSchema,
    `/core/category-types/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  const mapper = response?.data.map((item: any) => {
    let name;
    let options;
    if (item.group === GROUP_TYPES.ASSOCIATED_TYPE) {
      name = 'TIPO ASOCIADO';
      options = null;
    } else if (item.group === GROUP_TYPES.DISCOUNT_FREQ) {
      name = 'FRECUENCIA NOMINA';
      options = item.options[0].frequency;
    } else if (item.group === GROUP_TYPES.DAYS_TYPE) {
      name = 'TIPO JORNADA';
      options = null;
    }

    return {
      ...item,
      group: name,
      options: options,
    };
  });

  return {
    data: mapper,
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

export const getCategoryTypesByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    categoryTypesResponseSchema,
    `/core/category-types/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const getCategoryTypesByGroupAction = async (group: string) => {
  const [error, data] = await safeFetchApi(
    categoryTypesListResponseSchema,
    `/core/category-types/group/${group}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};
