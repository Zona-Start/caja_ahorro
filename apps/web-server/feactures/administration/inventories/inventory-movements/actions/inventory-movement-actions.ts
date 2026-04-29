'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  inventoryMovementAllResponseSchema,
  inventoryMovementMutationResponseSchema,
} from '../schemas/inventory-movement-api.schema';
import { CreateInventoryMovement } from '../schemas/inventory-movement.schema'; // Changed import

export async function getInventoryMovements(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  itemId?: number; // Changed from productId
  itemType?: string; // Changed from productId
  movementType?: string;
  documentType?: string;
  documentNumber?: string;
}): Promise<{ data: any; meta?: any }> {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.itemId && { itemId: params.itemId.toString() }), // Changed from productId
    ...(params.itemType && { itemType: params.itemType.toString() }), // Changed from productId
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

export async function createInventoryMovement(
  payload: CreateInventoryMovement,
): Promise<any> {
  // Changed payload type
  const [error, data] = await safeFetchApi(
    inventoryMovementMutationResponseSchema,
    '/inventory/inventory-movements',
    'POST',
    payload, // No need to destructure id
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Ocurrió un error desconocido');
  }

  return data;
}

// Removed updateInventoryMovement function

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

export const saveInventoryMovementAction = async (
  payload: CreateInventoryMovement,
) => {
  // Changed payload type
  try {
    // Always call createInventoryMovement as update is removed
    return await createInventoryMovement(payload);
  } catch (error: any) {
    throw new Error(
      error.message || 'Error guardando el movimiento de inventario',
    );
  }
};
