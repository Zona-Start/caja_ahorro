
'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { supplierPaymentMutationResponseSchema } from '../../supplier-payments/schemas';
import { CreateSupplierPaymentDto } from '../schemas/massive-payment.schema';

export const createMassivePaymentAction = async (
  payload: CreateSupplierPaymentDto[],
) => {
  const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    '/administration/supplier-payments/massive-payment',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating massive payment');
  }

  return data;
};
