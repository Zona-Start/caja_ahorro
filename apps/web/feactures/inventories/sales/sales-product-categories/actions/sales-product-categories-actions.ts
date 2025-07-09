'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  salesProductCategoryAllResponseSchema,
  salesProductCategoryMutationResponseSchema,
  salesProductCategoryResponse,
  SalesProductCategorySchemaAPI,
} from '../schemas/sales-product-categories-api.schema';
import { SalesProductCategory } from '../schemas/sales-product-categories.schema';

export async function getAllSalesProductCategories(): Promise<
  SalesProductCategorySchemaAPI[]
> {
  const [error, response] = await safeFetchApi(
    salesProductCategoryResponse,
    `/inventory/sales/sales-product-categories/all`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return response || [];
}

export async function getSalesProductCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ data: SalesProductCategorySchemaAPI[]; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    salesProductCategoryAllResponseSchema,
    `/inventory/sales/sales-product-categories/paginated?${searchParams}`,
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

export async function createSalesProductCategory(
  payload: SalesProductCategory,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    salesProductCategoryMutationResponseSchema,
    '/inventory/sales/sales-product-categories',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function updateSalesProductCategory(
  payload: SalesProductCategory,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    salesProductCategoryMutationResponseSchema,
    `/inventory/sales/sales-product-categories/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function deleteSalesProductCategory(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    salesProductCategoryMutationResponseSchema,
    `/inventory/sales/sales-product-categories/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export const saveSalesProductCategoryAction = async (
  payload: SalesProductCategory,
) => {
  try {
    if (!payload.id) {
      return await createSalesProductCategory(payload);
    } else {
      return await updateSalesProductCategory(payload);
    }
  } catch (error: any) {
    throw new Error(
      error.message || 'Error saving account sale product  category',
    );
  }
};
