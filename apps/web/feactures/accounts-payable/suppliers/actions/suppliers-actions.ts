'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  supplierAllSchema,
  supplierDeleteResponseSchema,
  supplierResponseAllSchema,
  supplierResponseCountSchema,
  supplierResponseOneSchema,
} from '../schemas/suppliers-response-api';
import { Supplier } from '../schemas/suppliers.schema';

export const getSupplierAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.category && { category: params.category }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    supplierResponseAllSchema,
    `/accounts-payable/suppliers/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier data');
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

export const createSupplierAction = async (payload: Supplier) => {
  const { id, ...payloadWithoutId } = payload;

  const PayloadData = {
    companyId: payloadWithoutId.companyId,
    code: payloadWithoutId.code,
    name: payloadWithoutId.name,
    taxId: payloadWithoutId.taxId,
    contactName: payloadWithoutId.contactName,
    contactEmail: payloadWithoutId.contactEmail,
    contactPhone: payloadWithoutId.contactPhone,
    state: payloadWithoutId.state,
    address: payloadWithoutId.address,
    category: payloadWithoutId.category,
  };

  const [error, data] = await safeFetchApi(
    supplierResponseOneSchema,
    '/accounts-payable/suppliers',
    'POST',
    PayloadData,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create supplier');
  }

  return data;
};

export const updateSuppliertAction = async (payload: Supplier) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    supplierResponseOneSchema,
    `/accounts-payable/suppliers/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update supplier');
  }

  return data;
};

export const deleteSupplierAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierDeleteResponseSchema,
    `/accounts-payable/suppliers/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error delete supplier');
  }

  return data;
};

export const getSupplierByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierResponseAllSchema,
    `/accounts-payable/suppliers/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier');
  }
  return data;
};

export const getSupplierCountAction = async () => {
  const [error, data] = await safeFetchApi(
    supplierResponseCountSchema,
    `/accounts-payable/suppliers/count`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier');
  }
  return data?.data;
};

export const getSupplierAllAction = async () => {
  const [error, data] = await safeFetchApi(
    supplierAllSchema,
    `/accounts-payable/suppliers/all`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching supplier');
  }

  return data?.data;
};

export const saveSupplierAction = async (payload: Supplier) => {
  try {
    if (payload.id) {
      return await updateSuppliertAction(payload);
    } else {
      return await createSupplierAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving supplier');
  }
};
