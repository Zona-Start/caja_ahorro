'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  fixedAssetCategoriesAllResponseSchema,
  fixedAssetCategoriesMutationResponseSchema,
  fixedAssetCategoriesResponse,
  FixedAssetCategoriesSchemaAPI,
} from '../schemas/fixed-asset-categories-api.schema';
import { FixedAssetCategories } from '../schemas/fixed-asset-categories.schema';

export async function getAllFixedAssetCategories(): Promise<
  FixedAssetCategoriesSchemaAPI[]
> {
  const [error, response] = await safeFetchApi(
    fixedAssetCategoriesResponse,
    `/inventory/assets/fixed-asset-categories/all`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return response || [];
}

export async function getFixedAssetCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ data: FixedAssetCategoriesSchemaAPI[]; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    fixedAssetCategoriesAllResponseSchema,
    `/inventory/assets/fixed-asset-categories/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
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
}

export async function createFixedAssetCategories(
  payload: FixedAssetCategories,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    fixedAssetCategoriesMutationResponseSchema,
    '/inventory/assets/fixed-asset-categories',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function updateFixedAssetCategories(
  payload: FixedAssetCategories,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    fixedAssetCategoriesMutationResponseSchema,
    `/inventory/assets/fixed-asset-categories/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function deleteFixedAssetCategories(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    fixedAssetCategoriesMutationResponseSchema,
    `/inventory/assets/fixed-asset-categories/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export const saveFixedAssetCategoriesAction = async (
  payload: FixedAssetCategories,
) => {
  try {
    if (!payload.id) {
      return await createFixedAssetCategories(payload);
    } else {
      return await updateFixedAssetCategories(payload);
    }
  } catch (error: any) {
    throw new Error(
      error.message || 'Error saving account sale product  category',
    );
  }
};
