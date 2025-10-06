'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountPayableAllResponseSchema,
  oneSupplierPaymentResponseApiSchema,
} from '../schemas/account-payable-api.schema';

export const getAccountsPayableAction = async (params: {
  page?: number;
  limit?: number;
  status?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierId?: number[];
  isAuthorizePayment?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status.join(',') }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.supplierId && { supplierId: params.supplierId.join(',') }),
    isAuthorizePayment: (params.isAuthorizePayment ?? true).toString(),
  });

  const [error, response] = await safeFetchApi(
    accountPayableAllResponseSchema,
    `/administration/supplier-payments/pending?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounts payable data');
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

// acttion para consultar un cuenta por pagar para pagos
export const getOneAccountsPayableAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    oneSupplierPaymentResponseApiSchema,
    `/administration/supplier-payments/get-one-account-payable/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounts payable data');
  }

  return {
    data: response,
  };
};
