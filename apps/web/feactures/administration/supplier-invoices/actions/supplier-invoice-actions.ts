'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  supplierInvoiceAllResponseSchema,
  supplierInvoiceMutationResponseSchema,
  supplierInvoiceResponseOneSchema,
} from '../schemas/supplier-invoice-api.schema';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

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

export const createSupplierInvoiceAction = async (payload: SupplierInvoice) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    invoiceDate: payloadWithoutId.invoiceDate.toISOString(),
    dueDate: payloadWithoutId.dueDate?.toISOString(),
    subtotal: payloadWithoutId.subtotal.toFixed(2),
    taxAmount: payloadWithoutId.taxAmount?.toFixed(2),
    totalAmount: payloadWithoutId.totalAmount.toFixed(2),
    items: payloadWithoutId.items.map(item => ({
      ...item,
      unitCost: item.unitCost.toFixed(6),
      totalLine: item.totalLine.toFixed(2),
    })),
  };

  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    '/administration/supplier-invoices',
    'POST',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating supplier invoice');
  }

  return data;
};

export const updateSupplierInvoiceAction = async (payload: SupplierInvoice) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    invoiceDate: payloadWithoutId.invoiceDate.toISOString(),
    dueDate: payloadWithoutId.dueDate?.toISOString(),
    subtotal: payloadWithoutId.subtotal.toFixed(2),
    taxAmount: payloadWithoutId.taxAmount?.toFixed(2),
    totalAmount: payloadWithoutId.totalAmount.toFixed(2),
    items: payloadWithoutId.items.map(item => ({
      ...item,
      unitCost: item.unitCost.toFixed(6),
      totalLine: item.totalLine.toFixed(2),
    })),
  };

  const [error, data] = await safeFetchApi(
    supplierInvoiceMutationResponseSchema,
    `/administration/supplier-invoices/${id}`,
    'PATCH',
    transform,
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

export const saveSupplierInvoiceAction = async (payload: SupplierInvoice) => {
  try {
    if (payload.id) {
      return await updateSupplierInvoiceAction(payload);
    } else {
      return await createSupplierInvoiceAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving supplier invoice');
  }
};
