'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  serviceAllResponseSchema,
  serviceMutationResponseSchema,
  serviceResponseSchema,
} from '../schemas/service-api.schema';
import { Service } from '../schemas/service.schema';
import { mapServiceApiToForm } from '../utils';

export async function getServiceAll() {
  const [error, response] = await safeFetchApi(
    serviceResponseSchema,
    '/administration/inventory/services/all',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return response || [];
}

export async function getServices(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  name?: string;
  categoryId?: number;
  status?: string;
}): Promise<{ data: any; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.name && { name: params.name }),
    ...(params.categoryId && { categoryId: params.categoryId.toString() }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.status && { status: params.status }),
  });

  const [error, response] = await safeFetchApi(
    serviceAllResponseSchema,
    `/administration/inventory/services/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }
  const data = mapServiceApiToForm(response?.data);

  return {
    data: data || [],
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

export async function createService(payload: Service): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    serviceMutationResponseSchema,
    '/administration/inventory/services',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function updateService(payload: Service): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    serviceMutationResponseSchema,
    `/administration/inventory/services/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function deleteService(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    serviceMutationResponseSchema,
    `/administration/inventory/services/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export const saveServiceAction = async (payload: Service) => {
  try {
    if (!payload.id) {
      return await createService(payload);
    } else {
      return await updateService(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error guardando el servicio');
  }
};
