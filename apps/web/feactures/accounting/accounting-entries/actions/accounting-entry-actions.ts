'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { AccountingEntry } from '../schemas/accounting-entry.schema';

import {
  accountingEntryDeleteResponseSchema,
  accountingEntryPaginationResponseSchema,
  accountingEntryResponseSchema,
} from '../schemas/accounting-entry-api.schema';

export const getPaginatedAccountingEntriesAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  initialCycleId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.initialCycleId && {
      accountingCycleId: params.initialCycleId.toString(),
    }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    accountingEntryPaginationResponseSchema,
    `/accounting-entries?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching paginated accounting entries:', error);
    throw new Error(
      error.message || 'Error al obtener los asientos contables.',
    );
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
    },
  };
};

export const createAccountingEntryAction = async (payload: AccountingEntry) => {
  console.log(payload);

  // const transform = (data: any) => {

  // }
  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    '/accounting-entries',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error creating accounting entry:', error);
    throw new Error(error.message || 'Error al crear el asiento contable.');
  }

  return data;
};

export const updateAccountingEntryAction = async (payload: AccountingEntry) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    `/accounting-entries/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error updating accounting entry:', error);
    throw new Error(
      error.message || 'Error al actualizar el asiento contable.',
    );
  }

  return data;
};

export const saveAccountingEntryAction = async (payload: AccountingEntry) => {
  try {
    if (payload.id) {
      return await updateAccountingEntryAction(payload);
    } else {
      return await createAccountingEntryAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error al guardar el asiento contable.');
  }
};

export const deleteAccountingEntryAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingEntryDeleteResponseSchema,
    `/accounting-entries/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error deleting accounting entry:', error);
    throw new Error(error.message || 'Error al eliminar el asiento contable.');
  }

  return data;
};

export const getAccountingEntryByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    `/accounting-entries/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error fetching accounting entry:', error);
    throw new Error(error.message || 'Error al obtener el asiento contable.');
  }

  return data;
};

export const submitAccountingEntryAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    `/accounting-entries/${id}/submit`,
    'POST',
  );

  if (error) {
    throw new Error(error.message || 'Error al enviar el asiento contable.');
  }

  return data;
};

export const postAccountingEntryAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    `/accounting-entries/${id}/post`,
    'POST',
  );

  if (error) {
    throw new Error(error.message || 'Error al contabilizar el asiento.');
  }

  return data;
};

export const cancelAccountingEntryAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingEntryResponseSchema,
    `/accounting-entries/${id}/cancel`,
    'POST',
  );

  if (error) {
    throw new Error(error.message || 'Error al anular el asiento contable.');
  }

  return data;
};
