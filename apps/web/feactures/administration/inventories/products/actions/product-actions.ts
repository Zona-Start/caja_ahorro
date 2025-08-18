'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  getOneProductResponseApiSchem,
  productAllResponseSchema,
  productMutationDeleteResponseSchema,
  productMutationResponseSchema,
  productResponseSchema,
} from '../schemas/product-api.schema';
import { Product } from '../schemas/product.schema';

export async function getProductAll() {
  const [error, response] = await safeFetchApi(
    productResponseSchema,
    '/administration/inventory/products/all',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return response?.data || [];
}

export async function getProductById(id: number) {
  const [error, response] = await safeFetchApi(
    getOneProductResponseApiSchem,
    `/administration/inventory/products/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return response?.data || {};
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  typeCategory?: number;
  status?: string;
}): Promise<{ data: any; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.typeCategory && {
      typeCategory: params.typeCategory.toString(),
    }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.status && { status: params.status }),
  });

  const [error, response] = await safeFetchApi(
    productAllResponseSchema,
    `/administration/inventory/products/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
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

export async function createProduct(payload: any): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    productMutationResponseSchema,
    '/administration/inventory/products',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function updateProduct(payload: any): Promise<any> {
  const { id, sku, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    productMutationResponseSchema,
    `/administration/inventory/products/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function deleteProduct(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    productMutationDeleteResponseSchema,
    `/administration/inventory/products/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export const saveProductAction = async (payload: Product) => {
  try {
    if (!payload.id) {
      return await createProduct(payload);
    } else {
      return await updateProduct(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error guardando el producto');
  }
};
