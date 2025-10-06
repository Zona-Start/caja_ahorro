'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { supplierAdvancedCreditSchema } from '../schemas';

//action para consultar los creditos disponibles de un proveedor
export const supplierAvailableCreditAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierAdvancedCreditSchema,
    `/administration/supplier-payments/supplier-available-credits/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier invoice');
  }

  return {
    data: data?.data || [],
  };
};
