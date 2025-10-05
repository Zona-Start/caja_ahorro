'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  appliedTransactionsResponseSchema,
  paymentHistoryResponseSchema,
} from '../schemas/payment-history-api.schema';

export const getPaymentHistoryAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    paymentHistoryResponseSchema,
    `/administration/supplier-payments/history/accounts-payable/${id}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching payment history');
  }

  return response;
};

export const getAppliedTransactionsAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    appliedTransactionsResponseSchema,
    `/administration/accounts-payable/applied-transactions/${id}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching applied transactions');
  }

  return response;
};
