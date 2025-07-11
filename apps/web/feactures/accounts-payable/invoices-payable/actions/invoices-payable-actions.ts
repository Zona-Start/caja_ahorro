'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  invoicesPayableDeleteResponseSchema,
  invoicesPayableResponseAllSchema,
  invoicesPayableResponseCountSchema,
  invoicesPayableResponseOneSchema,
} from '../schemas/invoices-payable-response-api';
import { InvoicesPayable } from '../schemas/invoices-payable.schema';

export const getInvoicesPayableAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    invoicesPayableResponseAllSchema,
    `/accounts-payable/invoices/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching invoices payable data');
  }

  const mappedData =
    response?.data
      ?.filter((item) => item.invoiceDate && item.dueDate)
      .map((item) => ({
        ...item,
        invoiceDate: new Date(item.invoiceDate),
        dueDate: new Date(item.dueDate),
      })) || [];

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

export const createInvoicesPayableAction = async (payload: InvoicesPayable) => {
  const { id, ...payloadWithoutId } = payload;

  const PayloadData = {
    supplierId: payloadWithoutId.supplierId,
    invoiceNumber: payloadWithoutId.invoiceNumber,
    invoiceDate: payloadWithoutId.invoiceDate,
    dueDate: payloadWithoutId.dueDate,
    totalAmount: payloadWithoutId.totalAmount,
    concept: payloadWithoutId.concept,
    observations: payloadWithoutId.observations,
  };

  const [error, data] = await safeFetchApi(
    invoicesPayableResponseOneSchema,
    '/accounts-payable/invoices',
    'POST',
    PayloadData,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create invoices payable');
  }

  return data;
};

export const updateInvoicesPayableAction = async (payload: InvoicesPayable) => {
  const { id, ...payloadWithoutId } = payload;

  const PayloadData = {
    supplierId: payloadWithoutId.supplierId,
    invoiceNumber: payloadWithoutId.invoiceNumber,
    invoiceDate: payloadWithoutId.invoiceDate,
    dueDate: payloadWithoutId.dueDate,
    totalAmount: payloadWithoutId.totalAmount,
    concept: payloadWithoutId.concept,
    observations: payloadWithoutId.observations,
  };

  const [error, data] = await safeFetchApi(
    invoicesPayableResponseOneSchema,
    `/accounts-payable/invoices/${id}`,
    'PATCH',
    PayloadData,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update invoices payable');
  }

  return data;
};

export const deleteInvoicesPayableAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    invoicesPayableDeleteResponseSchema,
    `/accounts-payable/invoices/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error delete invoices payable');
  }

  return data;
};

export const getInvoicesPayableByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    invoicesPayableResponseOneSchema,
    `/accounts-payable/invoices/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching invoices payable');
  }
  return data;
};

export const getInvoicesPayableCountAction = async () => {
  const [error, data] = await safeFetchApi(
    invoicesPayableResponseCountSchema,
    `/accounts-payable/invoices/summary`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching invoices payable');
  }
  return data?.data;
};

export const saveInvoicesPayableAction = async (payload: InvoicesPayable) => {
  try {
    if (payload.id) {
      return await updateInvoicesPayableAction(payload);
    } else {
      return await createInvoicesPayableAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving invoices payable');
  }
};
