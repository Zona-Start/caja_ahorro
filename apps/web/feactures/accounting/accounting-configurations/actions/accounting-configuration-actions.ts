'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountingConfigurationApiResponseSchema,
  accountingConfigurationDeleteResponseSchema,
  accountingConfigurationListApiResponseSchema,
} from '../schemas/accounting-configuration-api';
import { AccountingConfiguration } from '../schemas/accounting-configuration.schema';

export const getPaginatedAccountingConfigurationsAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    accountingConfigurationListApiResponseSchema,
    `/accounting-configurations/pagination?${searchParams}`,
    'GET'
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching paginated accounting configurations');
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

export const createAccountingConfigurationAction = async (payload: AccountingConfiguration) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingConfigurationApiResponseSchema,
    '/accounting-configurations',
    'POST',
    payloadWithoutId
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error Create accounting configurations');
  }

  return data;
};

export const updateAccountingConfigurationAction = async (payload: AccountingConfiguration) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingConfigurationApiResponseSchema,
    `/accounting-configurations/${id}`,
    'PATCH',
    payloadWithoutId
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error Update accounting configurations');
  }

  return data;
};

export const deleteAccountingConfigurationAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingConfigurationDeleteResponseSchema,
    `/accounting-configurations/${id}`,
    'DELETE'
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error Delete accounting configurations');
  }

  return data;
};

export const getAccountingConfigurationByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingConfigurationApiResponseSchema,
    `/accounting-configurations/${id}`,
    'GET'
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error Fetch accounting configurations');
  }

  return data;
};

export const saveAccountingConfigurationAction = async (payload: AccountingConfiguration) => {
  try {
    if (payload.id) {
      return await updateAccountingConfigurationAction(payload);
    } else {
      return await createAccountingConfigurationAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving accounting configuration data');
  }
};
