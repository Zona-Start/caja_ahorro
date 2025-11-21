'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountingBalanceListApiResponseSchema,
  bootstrappingResponseSchema,
  closeCycleResponseSchema,
  openCycleResponseSchema,
} from '../schemas/accounting-balance-api';
import {
  CloseCycle,
  InitialLoad,
  OpenCycle,
} from '../schemas/accounting-balance.schema';

export const getPaginatedAccountingBalancesAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  accountingCycleId?: string;
  companyId?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.accountingCycleId && {
      accountingCycleId: params.accountingCycleId,
    }),
    ...(params.companyId && { companyId: params.companyId }),
  });

  const [error, response] = await safeFetchApi(
    accountingBalanceListApiResponseSchema,
    `/accounting-balance?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching paginated accounting balances',
    );
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

export const bootstrappingAction = async (payload: InitialLoad) => {
  const [error, data] = await safeFetchApi(
    bootstrappingResponseSchema,
    '/accounting-balance/bootstrapping',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error en carga inicial de balances');
  }

  return data;
};

export const bootstrappingWithFileAction = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const [error, data] = await safeFetchApi(
    bootstrappingResponseSchema,
    '/accounting-balance/bootstrapping',
    'POST',
    formData,
    {
      headers: {
        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
      },
    },
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(
      error.message || 'Error en carga inicial de balances desde Excel',
    );
  }

  return data;
};

export const closeCycleAction = async (
  cycleId: number,
  payload: CloseCycle,
) => {
  const [error, data] = await safeFetchApi(
    closeCycleResponseSchema,
    `/accounting-balance/close/${cycleId}`,
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error al cerrar ciclo contable');
  }

  return data;
};

export const openCycleAction = async (payload: OpenCycle) => {
  const [error, data] = await safeFetchApi(
    openCycleResponseSchema,
    '/accounting-balance/open',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error al abrir nuevo ciclo contable');
  }

  return data;
};
