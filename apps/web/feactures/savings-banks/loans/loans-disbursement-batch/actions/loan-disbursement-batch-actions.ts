'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import z from 'zod';
import {
  approvedSourceItemsApiResponseSchema,
  loanDisbursementBatchApiResponseSchema,
  loanDisbursementBatchApiSchema,
  loanDisbursementBatchMutationSchema,
} from '../schemas/loan-disbursement-batch-api-response';
import {
  ConfirmLoanDisbursementBatch,
  CreateLoanDisbursementBatch,
  FilterLoanDisbursementBatch,
} from '../schemas/loan-disbursement-batch.schema';

export const createLoanDisbursementBatchAction = async (
  dto: CreateLoanDisbursementBatch,
) => {
  const [error, data] = await safeFetchApi(
    loanDisbursementBatchMutationSchema,
    '/loan-disbursement/batch',
    'POST',
    dto,
  );

  if (error) {
    throw new Error(error.message || 'Error creating payment batch');
  }
  return data;
};

export const getLoanDisbursementBatchesAction = async (
  filters: FilterLoanDisbursementBatch,
) => {
  const params: Record<string, string> = {
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 10).toString(),
  };

  if (filters.status) params.status = String(filters.status);
  if (filters.search) params.search = String(filters.search);
  if (filters.sortBy) params.sortBy = String(filters.sortBy);
  if (filters.sortOrder) params.sortOrder = String(filters.sortOrder);

  const searchParams = new URLSearchParams(params);

  const [error, response] = await safeFetchApi(
    loanDisbursementBatchApiResponseSchema,
    `/loan-disbursement/batch?${searchParams}`,
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

export const getLoanDisbursementBatchDetailsAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    loanDisbursementBatchApiSchema, // Assuming this schema can handle the full details with items
    `/loan-disbursement/batch/${id}`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching payment batch details');
  }
  return data;
};

export const markAsUploadedAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    loanDisbursementBatchMutationSchema,
    `/loan-disbursement/batch/${id}/upload`,
    'PATCH',
  );

  if (error) {
    throw new Error(error.message || 'Error marking payment batch as uploaded');
  }
  return data;
};

export const confirmLoanDisbursementBatchAction = async (
  id: number,
  dto: ConfirmLoanDisbursementBatch,
) => {
  const [error, data] = await safeFetchApi(
    loanDisbursementBatchMutationSchema,
    `/loan-disbursement/batch/${id}/confirm`,
    'POST',
    dto,
  );

  if (error) {
    throw new Error(error.message || 'Error confirming payment batch');
  }
  return data;
};

export const cancelLoanDisbursementBatchAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    loanDisbursementBatchMutationSchema,
    `/loan-disbursement/batch/${id}/cancel`,
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
    `/loan-disbursement/batch/${id}/txt`,
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
