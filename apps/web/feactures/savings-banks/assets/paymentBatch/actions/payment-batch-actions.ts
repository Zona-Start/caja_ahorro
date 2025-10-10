'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import z from 'zod';
import {
  approvedSourceItemsApiResponseSchema,
  paymentBatchApiResponseSchema,
  paymentBatchApiSchema,
  paymentBatchMutationSchema,
} from '../schemas/payment-batch-api-response';
import {
  ConfirmPaymentBatch,
  CreatePaymentBatch,
  FilterPaymentBatch,
} from '../schemas/payment-batch.schema';

export const createPaymentBatchAction = async (dto: CreatePaymentBatch) => {
  const [error, data] = await safeFetchApi(
    paymentBatchMutationSchema,
    '/savings-banks/payment-batches',
    'POST',
    dto,
  );

  if (error) {
    throw new Error(error.message || 'Error creating payment batch');
  }
  return data;
};

export const getPaymentBatchesAction = async (filters: FilterPaymentBatch) => {
  const searchParams = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 10).toString(),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    paymentBatchApiResponseSchema,
    `/savings-banks/payment-batches?${searchParams}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching payment batches');
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

export const getPaymentBatchDetailsAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    paymentBatchApiSchema, // Assuming this schema can handle the full details with items
    `/savings-banks/payment-batches/${id}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching payment batch details');
  }
  return data;
};

export const markAsUploadedAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    paymentBatchMutationSchema,
    `/savings-banks/payment-batches/${id}/uploaded`,
    'PATCH',
  );

  if (error) {
    throw new Error(error.message || 'Error marking payment batch as uploaded');
  }
  return data;
};

export const confirmPaymentBatchAction = async (
  id: number,
  dto: ConfirmPaymentBatch,
) => {
  const [error, data] = await safeFetchApi(
    paymentBatchMutationSchema,
    `/savings-banks/payment-batches/${id}/confirm`,
    'PATCH',
    dto,
  );

  if (error) {
    throw new Error(error.message || 'Error confirming payment batch');
  }
  return data;
};

export const cancelPaymentBatchAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    paymentBatchMutationSchema,
    `/savings-banks/payment-batches/${id}/cancel`,
    'PATCH',
  );

  if (error) {
    throw new Error(error.message || 'Error canceling payment batch');
  }
  return data;
};

export const downloadTxtFileAction = async (id: number) => {
  // 📝 Ahora la función espera una respuesta de texto simple del servidor
  const [error, data] = await safeFetchApi(
    z.string(), // ✅ Cambia el esquema a z.string()
    `/savings-banks/payment-batches/${id}/txt`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error al descargar el archivo TXT');
  }

  // El servidor solo devuelve el contenido, por lo que creamos el objeto completo
  // en el cliente para el componente que lo usa.
  return {
    fileName: `pagos-por-lote-${id}.txt`, // El nombre del archivo puede ser inferido
    content: data, // Aquí está el contenido del archivo
  };
};

export const getApprovedLoansAction = async () => {
  const [error, response] = await safeFetchApi(
    approvedSourceItemsApiResponseSchema,
    '/loan/approved',
    'GET',
  );
  if (error) {
    throw new Error(error.message || 'Error fetching approved loans');
  }
  return response?.data;
};

export const getApprovedWithdrawalsAction = async () => {
  const [error, response] = await safeFetchApi(
    approvedSourceItemsApiResponseSchema,
    '/savings-banks/withdrawal-associate/approved',
    'GET',
  );
  if (error) {
    throw new Error(error.message || 'Error fetching approved withdrawals');
  }
  return response?.data;
};

export const getApprovedLiquidationsAction = async () => {
  const [error, response] = await safeFetchApi(
    approvedSourceItemsApiResponseSchema,
    '/savings-banks/settlement-associate/approved',
    'GET',
  );
  if (error) {
    throw new Error(error.message || 'Error fetching approved liquidations');
  }
  return response?.data;
};
