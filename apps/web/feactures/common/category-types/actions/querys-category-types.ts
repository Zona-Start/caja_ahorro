'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  categoryTypesListResponseSchema,
  categoryTypesPaginationResponseSchema,
  categoryTypesResponseSchema,
} from '../schemas/category-types-response';

export const getCategoryTypesAction = async () => {
  const [error, data] = await safeFetchApi(
    categoryTypesListResponseSchema,
    '/configurations/category-types',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
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
    `/configurations/category-types/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  const mapper = response?.data.map((item: any) => {
    return {
      ...item,
      group: item.group.replace(/_/g, ' '),
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
    `/configurations/category-types/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getCategoryTypesByGroupAction = async (group: string) => {
  const [error, data] = await safeFetchApi(
    categoryTypesResponseSchema,
    `/configurations/category-types/group/${group}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};
