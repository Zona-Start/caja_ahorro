
'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  supplierPaymentAllResponseSchema,
  supplierPaymentMutationResponseSchema,
  supplierPaymentResponseOneSchema,
} from '../schemas';
import { SupplierPayment } from '../schemas';

export const getSupplierPaymentsAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  supplierId?: number;
  startDate?: Date;
  endDate?: Date;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.supplierId && { supplierId: params.supplierId.toString() }),
    ...(params.startDate && { startDate: params.startDate.toISOString() }),
    ...(params.endDate && { endDate: params.endDate.toISOString() }),
  });

  const [error, response] = await safeFetchApi(
    supplierPaymentAllResponseSchema,
    `/administration/supplier-payments?${searchParams}`,
    'GET'
  );

  if (error) {
    throw new Error(error.message || 'Error fetching supplier payments');
  }

  return {
    data: response?.data || [],
    meta: response?.meta,
  };
};

export const getSupplierPaymentByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierPaymentResponseOneSchema,
    `/administration/supplier-payments/${id}`,
    'GET'
  );

  if (error) {
    throw new Error(error.message || 'Error fetching supplier payment');
  }
  return data;
};

export const createSupplierPaymentAction = async (payload: Partial<SupplierPayment>) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    '/administration/supplier-payments',
    'POST',
    payloadWithoutId
  );

  if (error) {
    throw new Error(error.message || 'Error creating supplier payment');
  }
  return data;
};

export const updateSupplierPaymentAction = async ({ id, ...payload }: Partial<SupplierPayment>) => {
  const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    `/administration/supplier-payments/${id}`,
    'PATCH',
    payload
  );

  if (error) {
    throw new Error(error.message || 'Error updating supplier payment');
  }
  return data;
};

// Acción genérica para cambiar el estado de un pago
async function changePaymentStatusAction(paymentId: number, action: string) {
    const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    `/administration/supplier-payments/${paymentId}/${action}`,
    'POST' // La mayoría de las acciones de estado son POST en el backend
  );

  if (error) {
    throw new Error(error.message || `Error changing status to ${action}`);
  }
  return data;
}

export const validateSupplierPaymentAction = (id: number) => changePaymentStatusAction(id, 'validate');
export const approveSupplierPaymentAction = (id: number) => changePaymentStatusAction(id, 'approve');
export const executeSupplierPaymentAction = (id: number) => changePaymentStatusAction(id, 'execute');
export const reverseSupplierPaymentAction = (id: number) => changePaymentStatusAction(id, 'reverse');
