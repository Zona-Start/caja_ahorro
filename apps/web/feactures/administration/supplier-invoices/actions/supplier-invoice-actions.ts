'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  supplierAdvancedCreditSchema,
  supplierInvoiceAllResponseSchema,
  supplierInvoiceDraftPendingResponseSchema,
  supplierInvoiceMutationResponseSchema,
  supplierInvoiceResponseOneSchema,
} from '../schemas/supplier-invoice-api.schema';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

export const getInvoicesDraftPendingAction = async () => {
  const [error, response] = await safeFetchApi(
    supplierInvoiceDraftPendingResponseSchema,
    `/administration/supplier-invoices/status/draft-pending`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier invoices data');
  }

  return {
    data: response?.data || [],
  };
};

export const getSupplierInvoicesAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierId?: number;
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
    ...(params.supplierId && { supplierId: params.supplierId.toString() }),
    ...(params.startDate && { startDate: params.startDate.toISOString() }),
    ...(params.endDate && { endDate: params.endDate.toISOString() }),
  });

  const [error, response] = await safeFetchApi(
    supplierInvoiceAllResponseSchema,
    `/administration/supplier-invoices/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier invoices data');
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

export const supplierAvailableCreditAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierAdvancedCreditSchema,
    `/administration/supplier-invoices/supplier-available-credits/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier invoice');
  }

  return data;
};

export const createSupplierInvoiceAction = async (
  payload: Partial<SupplierInvoice>,
) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    '/administration/supplier-invoices',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating supplier invoice');
  }

  return data;
};

export const updateSupplierInvoiceAction = async ({
  id,
  ...payload
}: Partial<SupplierInvoice>) => {
  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    `/administration/supplier-invoices/${id}`,
    'PATCH',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier invoice');
  }

  return data;
};

export const accountForSupplierInvoiceAction = async ({
  id,
  ...payload
}: Partial<SupplierInvoice>) => {
  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    `/administration/supplier-invoices/accountFor/${id}`,
    'PATCH',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier invoice');
  }

  return data;
};

export const deleteSupplierInvoiceAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    `/administration/supplier-invoices/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error deleting supplier invoice');
  }

  return data;
};

export const getSupplierInvoiceByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierInvoiceResponseOneSchema,
    `/administration/supplier-invoices/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier invoice');
  }
  return data;
};
