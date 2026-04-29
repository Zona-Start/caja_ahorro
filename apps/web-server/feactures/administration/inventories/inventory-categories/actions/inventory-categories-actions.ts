'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  inventoryCategoryAllResponseSchema,
  inventoryCategoryApiSchema,
  inventoryCategoryMutationResponseSchema,
  inventoryCategoryResponse,
  InventoryCategorySchemaAPI,
} from '../schemas/inventory-category-api.schema';
import { InventoryCategory } from '../schemas/inventory-category.schema';

export async function getAllInventoryCategories(
  group: string,
): Promise<{ id: number; name: string }[]> {
  const [error, response] = await safeFetchApi(
    inventoryCategoryResponse,
    `/administration/inventory/categories/all/${group}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return response || [];
}

export async function getInventoryCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  group?: string;
}): Promise<{ data: InventoryCategorySchemaAPI[]; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.group && { group: params.group }),
  });

  const [error, response] = await safeFetchApi(
    inventoryCategoryAllResponseSchema,
    `/administration/inventory/categories/paginated?${searchParams}`,
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

export async function getInventoryCategoryById(id: number): Promise<any> {
  const [error, response] = await safeFetchApi(
    inventoryCategoryApiSchema,
    `/administration/inventory/categories/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return response;
}

export async function createInventoryCategory(
  payload: InventoryCategory,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    inventoryCategoryMutationResponseSchema,
    '/administration/inventory/categories',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function updateInventoryCategory(
  payload: InventoryCategory,
): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    inventoryCategoryMutationResponseSchema,
    `/administration/inventory/categories/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export async function deleteInventoryCategory(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    inventoryCategoryMutationResponseSchema,
    `/administration/inventory/categories/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
}

export const saveInventoryCategoryAction = async (
  payload: InventoryCategory,
) => {
  try {
    if (!payload.id) {
      return await createInventoryCategory(payload);
    } else {
      return await updateInventoryCategory(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving inventory category');
  }
};
