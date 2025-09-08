'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  reversePaymentMutationResponseSchema,
  supplierPaymentAllResponseSchema,
} from '../schemas/supplier-payment-api.schema';

export const getSupplierPaymentsAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  supplierIds?: number[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  let Params = '';

  // Verificar si hay IDs de proveedores y construir la cadena de búsqueda
  if (params.supplierIds && params.supplierIds.length > 0) {
    Params = `${params.supplierIds.join(',')}`;
  }

  const searchParams = new URLSearchParams({
    ...(params.supplierIds && { supplierIds: Params }),
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    supplierPaymentAllResponseSchema,
    `/administration/supplier-payments?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier payments data');
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

export const reversePaymentsAction = async (payload: {
  paymentIds: number[];
}) => {
  const [error, data] = await safeFetchApi(
    reversePaymentMutationResponseSchema,
    '/administration/supplier-payments/reverse',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error reversing payments');
  }

  return data;
};
