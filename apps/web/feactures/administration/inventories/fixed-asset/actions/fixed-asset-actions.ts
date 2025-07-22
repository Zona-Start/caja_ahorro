'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  fixedAssetAllResponseSchema,
  fixedAssetMutationResponseSchema,
  fixedAssetResponseAllSchema,
} from '../schemas/fixed-asset-api.schema';
import { FixedAsset } from '../schemas/fixed-asset.schema';

export async function getFixedAssetAll() {
  const [error, response] = await safeFetchApi(
    fixedAssetResponseAllSchema,
    '/inventory/assets/fixed-assets/all',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return response?.data || [];
}

export async function getFixedAsset(params: {
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
    fixedAssetAllResponseSchema,
    `/inventory/assets/fixed-assets/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  // const tansForm = response?.data.map((item) => {
  //   return {
  //     ...item,
  //     defaultPurchaseCost: Number(item.defaultPurchaseCost).toFixed(2),
  //     defaultSellingPrice: Number(item.defaultSellingPrice).toFixed(2),
  //   };
  // });

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

export async function createFixedAsset(payload: FixedAsset): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    fixedAssetMutationResponseSchema,
    '/inventory/assets/fixed-assets',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function updateFixedAsset(payload: FixedAsset): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    fixedAssetMutationResponseSchema,
    `/inventory/assets/fixed-assets/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function deleteFixedAsset(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    fixedAssetMutationResponseSchema,
    `/inventory/assets/fixed-assets/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export const saveFixedAssetAction = async (payload: FixedAsset) => {
  try {
    if (!payload.id) {
      return await createFixedAsset(payload);
    } else {
      return await updateFixedAsset(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error guardando el producto de venta');
  }
};
