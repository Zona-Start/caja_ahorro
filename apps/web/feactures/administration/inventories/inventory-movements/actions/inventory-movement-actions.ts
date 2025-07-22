'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  inventoryMovementAllResponseSchema,
  inventoryMovementMutationResponseSchema,
} from '../schemas/inventory-movement-api.schema';
import { InventoryMovement } from '../schemas/inventory-movement.schema';

export async function getInventoryMovements(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  productId?: number;
  movementType?: string;
  documentType?: string;
  documentNumber?: string;
}): Promise<{ data: any; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.productId && { productId: params.productId.toString() }),
    ...(params.movementType && { movementType: params.movementType }),
    ...(params.documentType && { documentType: params.documentType }),
    ...(params.documentNumber && { documentNumber: params.documentNumber }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    inventoryMovementAllResponseSchema,
    `/inventory/inventory-movements/paginated?${searchParams}`,
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

export async function createInventoryMovement(payload: InventoryMovement): Promise<any> {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    inventoryMovementMutationResponseSchema,
    '/inventory/inventory-movements',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function updateInventoryMovement(payload: InventoryMovement): Promise<any> {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    inventoryMovementMutationResponseSchema,
    `/inventory/inventory-movements/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export async function deleteInventoryMovement(id: number): Promise<any> {
  const [error, data] = await safeFetchApi(
    inventoryMovementMutationResponseSchema,
    `/inventory/inventory-movements/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

export const saveInventoryMovementAction = async (payload: InventoryMovement) => {
  try {
    if (!payload.id) {
      return await createInventoryMovement(payload);
    } else {
      return await updateInventoryMovement(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error guardando el movimiento de inventario');
  }
};
