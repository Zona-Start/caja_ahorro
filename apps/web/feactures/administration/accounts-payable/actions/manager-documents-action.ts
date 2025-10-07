'use server';

import { safeFetchApi } from '@/lib';
import {
  autorizeAdvanceResponseSchema,
  getAppliedTransaccionApiSchema,
  getSupplierTransactionAdvanceApiSchema,
  getSupplierTransactionNoteCreditApiSchema,
  getSupplierTransactionNoteDebitApiSchema,
} from '../schemas/manage-documents.schema';

export const getSupplierTransactionsAdvanceAction = async () => {
  const [error, response] = await safeFetchApi(
    getSupplierTransactionAdvanceApiSchema,
    `/administration/supplier-transactions/advance`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching supplier transactions data',
    );
  }

  return {
    data: response?.data || [],
    // meta: response?.meta || {
    //   page: 1,
    //   limit: 10,
    //   totalCount: 0,
    //   totalPages: 1,
    //   hasNextPage: false,
    //   hasPreviousPage: false,
    //   nextPage: null,
    //   previousPage: null,
    // },
  };
};

export const getSupplierTransactionsNoteCredit = async () => {
  const [error, response] = await safeFetchApi(
    getSupplierTransactionNoteCreditApiSchema,
    `/administration/supplier-transactions/note-credit`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching supplier transactions data',
    );
  }

  return {
    data: response?.data || [],
    // meta: response?.meta || {
    //   page: 1,
    //   limit: 10,
    //   totalCount: 0,
    //   totalPages: 1,
    //   hasNextPage: false,
    //   hasPreviousPage: false,
    //   nextPage: null,
    //   previousPage: null,
    // },
  };
};

export const getSupplierTransactionsNoteDebit = async () => {
  const [error, response] = await safeFetchApi(
    getSupplierTransactionNoteDebitApiSchema,
    `/administration/supplier-transactions/note-debit`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching supplier transactions data',
    );
  }

  return {
    data: response?.data || [],
    // meta: response?.meta || {
    //   page: 1,
    //   limit: 10,
    //   totalCount: 0,
    //   totalPages: 1,
    //   hasNextPage: false,
    //   hasPreviousPage: false,
    //   nextPage: null,
    //   previousPage: null,
    // },
  };
};

//action para autorizar pago a un anticipo
export const authorizeAdavancePaymentAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    autorizeAdvanceResponseSchema,
    `/administration/supplier-transactions/authorize-advance/${id}`,
    'PATCH',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error authorizing account payable');
  }

  return data;
};

//action para consultar a cuales cuentas se ha aplicado un anticipo o una nota de credito
export const getAppliedTransactionAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    getAppliedTransaccionApiSchema,
    `/administration/accounts-payable/applied-transaction/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error authorizing account payable');
  }

  return data;
};
