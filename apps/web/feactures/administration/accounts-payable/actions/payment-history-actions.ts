'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { supplierPaymentAllResponseSchema } from '../../supplier-payments/schemas';

export const getPaymentsByAccountPayableAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    supplierPaymentAllResponseSchema,
    `/administration/supplier-payments/by-account-payable/${id}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching payment history');
  }

  return response;
};
