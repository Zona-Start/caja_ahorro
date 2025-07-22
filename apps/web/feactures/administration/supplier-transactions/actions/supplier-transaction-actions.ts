'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  supplierTransactionAllResponseSchema,
  supplierTransactionMutationResponseSchema,
  supplierTransactionResponseOneSchema,
} from '../schemas/supplier-transaction-api.schema';
import { SupplierTransaction } from '../schemas/supplier-transaction.schema';

export const getSupplierTransactionsAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  accountsPayableId?: number;
  transactionType?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.accountsPayableId && { accountsPayableId: params.accountsPayableId.toString() }),
    ...(params.transactionType && { transactionType: params.transactionType }),
    ...(params.startDate && { startDate: params.startDate.toISOString() }),
    ...(params.endDate && { endDate: params.endDate.toISOString() }),
  });

  const [error, response] = await safeFetchApi(
    supplierTransactionAllResponseSchema,
    `/administration/supplier-transactions/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier transactions data');
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
};

export const createSupplierTransactionAction = async (payload: SupplierTransaction) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    transactionDate: payloadWithoutId.transactionDate.toISOString(),
    amount: payloadWithoutId.amount.toFixed(2),
  };

  const [error, data] = await safeFetchApi(
    supplierTransactionMutationResponseSchema,
    '/administration/supplier-transactions',
    'POST',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating supplier transaction');
  }

  return data;
};

export const updateSupplierTransactionAction = async (payload: SupplierTransaction) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    transactionDate: payloadWithoutId.transactionDate.toISOString(),
    amount: payloadWithoutId.amount.toFixed(2),
  };

  const [error, data] = await safeFetchApi(
    supplierTransactionMutationResponseSchema,
    `/administration/supplier-transactions/${id}`,
    'PATCH',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier transaction');
  }

  return data;
};

export const deleteSupplierTransactionAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierTransactionMutationResponseSchema,
    `/administration/supplier-transactions/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error deleting supplier transaction');
  }

  return data;
};

export const getSupplierTransactionByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierTransactionResponseOneSchema,
    `/administration/supplier-transactions/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier transaction');
  }
  return data;
};

export const saveSupplierTransactionAction = async (payload: SupplierTransaction) => {
  try {
    if (payload.id) {
      return await updateSupplierTransactionAction(payload);
    } else {
      return await createSupplierTransactionAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving supplier transaction');
  }
};
