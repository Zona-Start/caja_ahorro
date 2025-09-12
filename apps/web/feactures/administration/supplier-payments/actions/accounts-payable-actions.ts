'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { accountPayableAllResponseSchema } from '../../accounts-payable/schemas';
import { mapAccountPayableApiToForm } from '../utils';

export const getAccountsPayableAction = async (params: {
  page?: number;
  limit?: number;
  status?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierIds?: number[];
  isAuthorizePayment?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status.join(',') }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.supplierIds && { supplierIds: params.supplierIds.join(',') }),
    isAuthorizePayment: (params.isAuthorizePayment ?? true).toString(),
  });

  const [error, response] = await safeFetchApi(
    accountPayableAllResponseSchema,
    `/administration/accounts-payable/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounts payable data');
  }

  const mappedData = mapAccountPayableApiToForm(response?.data || []);

  return {
    data: mappedData || [],
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
