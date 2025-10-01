'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { BankMovement } from '../schemas/bank-movement.schema';

import {
  bankMovementDeleteResponseSchema,
  bankMovementPaginationResponseSchema,
  bankMovementResponseSchema,
} from '../schemas/bank-movement-api.schema';

export const getPaginatedBankMovementsAction = async (params: {
  page?: number;
  limit?: number;
  bankAccountId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.bankAccountId && { bankAccountId: params.bankAccountId.toString() }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  });

  const [error, response] = await safeFetchApi(
    bankMovementPaginationResponseSchema,
    `/bank-movements?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching paginated bank movements:', error);
    throw new Error(
      error.message || 'Error al obtener los movimientos bancarios.',
    );
  }

  return {
    data: response?.data || [],
    total: response?.total || 0,
    page: response?.page || 1,
    limit: response?.limit || 10,
  };
};

export const createBankMovementAction = async (payload: BankMovement) => {
  const [error, data] = await safeFetchApi(
    bankMovementResponseSchema,
    '/bank-movements',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error creating bank movement:', error);
    throw new Error(error.message || 'Error al crear el movimiento bancario.');
  }

  return data;
};

export const updateBankMovementAction = async (payload: BankMovement) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    bankMovementResponseSchema,
    `/bank-movements/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error updating bank movement:', error);
    throw new Error(
      error.message || 'Error al actualizar el movimiento bancario.',
    );
  }

  return data;
};

export const saveBankMovementAction = async (payload: BankMovement) => {
  try {
    if (payload.id) {
      return await updateBankMovementAction(payload);
    } else {
      return await createBankMovementAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error al guardar el movimiento bancario.');
  }
};

export const deleteBankMovementAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    bankMovementDeleteResponseSchema,
    `/bank-movements/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error deleting bank movement:', error);
    throw new Error(error.message || 'Error al eliminar el movimiento bancario.');
  }

  return data;
};

export const getBankMovementByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    bankMovementResponseSchema,
    `/bank-movements/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching bank movement:', error);
    throw new Error(error.message || 'Error al obtener el movimiento bancario.');
  }

  return data;
};
