'use server';

import { buildSearchParams } from '@/lib/buildSearchParams';
import { safeFetchApi } from '@/lib/fetch.api';
import z from 'zod';
import {
  bankMovementResponseSchema,
  paginatedBankMovementsResponseSchema,
  paginatedLinkablesResponseSchema,
} from '../schemas/bank-movement-api.schema';
import { BankTransactionCategory } from '../schemas/bank-movement-options';
import { BankMovement } from '../schemas/bank-movement.schema';

const URL = '/bank-movements';

export const getPaginatedBankMovementsAction = async (params: {
  page?: number;
  limit?: number;
  bankAccountId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = buildSearchParams(params);

  const [error, response] = await safeFetchApi(
    paginatedBankMovementsResponseSchema,
    `${URL}?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching paginated bank movements:', error);
    throw new Error('Error al obtener los movimientos bancarios.');
  }

  return response;
};

export const createAndReconcileMovementAction = async (
  payload: BankMovement,
) => {
  const { links, ...data } = payload;
  const trasnformdata = {
    movement: data,
    links,
  };

  const [error, response] = await safeFetchApi(
    bankMovementResponseSchema,
    `${URL}/create-and-reconcile`,
    'POST',
    trasnformdata,
  );

  if (error) {
    console.error('Error creating bank movement:', error);
    throw new Error(error.message || 'Error al crear el movimiento bancario.');
  }

  return response?.data;
};

export const getLinkablesAction = async (params: {
  category: BankTransactionCategory;
  q?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = new URLSearchParams({
    ...(params.category && { category: params.category }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
    ...(params.q && { q: params.q }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
  });

  const [error, response] = await safeFetchApi(
    paginatedLinkablesResponseSchema,
    `${URL}/linkables?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching linkables:', error);
    throw new Error('Error al obtener los registros vinculables.');
  }

  return response;
};

export const unlinkMovementAction = async (id: number) => {
  const [error] = await safeFetchApi(
    z.any(), // No content expected, so any schema is fine
    `${URL}/${id}/unlink`,
    'DELETE',
  );

  if (error) {
    console.error('Error unlinking movement:', error);
    throw new Error('Error al desvincular el movimiento.');
  }

  return { message: 'Movimiento desvinculado con éxito' };
};

export const reverseMovementAction = async (payload: {
  id: number;
  reason: string;
  valueDate: string;
}) => {
  const { id, ...body } = payload;
  const [error, response] = await safeFetchApi(
    bankMovementResponseSchema, // Assuming it returns the new reversed movement
    `${URL}/${id}/reverse`,
    'POST',
    body,
  );

  if (error) {
    console.error('Error reversing movement:', error);
    throw new Error('Error al reversar el movimiento.');
  }

  return response?.data;
};

export const getBankMovementByIdAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    bankMovementResponseSchema,
    `${URL}/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching bank movement:', error);
    throw new Error('Error al obtener el movimiento bancario.');
  }

  return response?.data;
};
