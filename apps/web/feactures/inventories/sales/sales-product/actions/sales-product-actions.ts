'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  salesProductAllResponseSchema,
  salesProductMutationResponseSchema,
  salesProductResponseSchema,
} from '../schemas/sales-product-api.schema';
import { SalesProduct } from '../schemas/sales-product.schema';

export async function getSalesProductAll() {
  const [error, response] = await safeFetchApi(
    salesProductResponseSchema,
    '/inventory/sales/sales-products/all',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return response?.data || [];
}

export async function getSalesProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  typeCategory?: string;
  status?: string;
}): Promise<{ data: any; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.typeCategory && { typeCategory: params.typeCategory }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.status && { status: params.status }),
  });

  const [error, response] = await safeFetchApi(
    salesProductAllResponseSchema,
    `/inventory/sales/sales-products/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  const tansForm = response?.data.map((item) => {
    return {
      ...item,
      defaultPurchaseCost: Number(item.defaultPurchaseCost).toFixed(2),
      defaultSellingPrice: Number(item.defaultSellingPrice).toFixed(2),
    };
  });

  return {
    data: tansForm || [],
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

export async function createSalesProduct(payload: SalesProduct): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    salesProductMutationResponseSchema,
    '/inventory/sales/sales-products',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function updateSalesProduct(payload: SalesProduct): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    salesProductMutationResponseSchema,
    `/inventory/sales/sales-products/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function deleteSalesProduct(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    salesProductMutationResponseSchema,
    `/inventory/sales/sales-products/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export const saveSalesProductAction = async (payload: SalesProduct) => {
  try {
    if (!payload.id) {
      return await createSalesProduct(payload);
    } else {
      return await updateSalesProduct(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error guardando el producto de venta');
  }
};
