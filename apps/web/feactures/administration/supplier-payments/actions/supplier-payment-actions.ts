'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { accountPayableAllResponseSchema } from '../../accounts-payable/schemas';
import { PayAccountPayableHookAction, PayAdvance } from '../schemas';
import {
  payAdvanceMutationResponseSchema,
  reversePaymentMutationResponseSchema,
  supplierPaymentAllResponseSchema,
  supplierPaymentMutationResponseSchema,
} from '../schemas/supplier-payment-api.schema';
import { mapAccountPayableApiToForm } from '../utils';

// action para buscar los pagos realizados
export const getSupplierPaymentsAction = async (params: {
  page?: number;
  limit?: number;
  status?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status.join(',') }),
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

export const getPaymentsBySupplierAction = async (params: {
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

// action para guardar datos de un pago de  la cuenta por pagar
export const payAccountPayableAction = async (
  payload: PayAccountPayableHookAction,
) => {
  const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    '/administration/supplier-payments/pay',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error processing payment');
  }
  return data;
};

// action para guardar datos de un pago de anticipo
export const payAdvanceAction = async (payload: PayAdvance) => {
  const [error, data] = await safeFetchApi(
    payAdvanceMutationResponseSchema,
    '/administration/supplier-payments/pay-advance',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error processing payment');
  }
  return data;
};

// action  para consultar las cuentas por pagar para pagos
export const getAccountsPayableBySuppliersAction = async (params: {
  supplierIds?: number[]; // <--- Modificar el tipo de dato a un array de números
}) => {
  let searchParams = '';

  // Verificar si hay IDs de proveedores y construir la cadena de búsqueda
  if (params.supplierIds && params.supplierIds.length > 0) {
    searchParams = `supplierIds=${params.supplierIds.join(',')}`;
  }

  const [error, response] = await safeFetchApi(
    accountPayableAllResponseSchema,
    // Unir la URL base con los parámetros
    `/administration/accounts-payable/by-suppliers?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounts payable data');
  }

  const mappedData = mapAccountPayableApiToForm(response?.data || []);

  return {
    data: mappedData || [],
  };
};
