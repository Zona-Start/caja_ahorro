'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { currenciesAllResponseSchema } from '../schemas/currencies.schema';
import {
  SettingSystem,
  settingSystemAllResponseSchema,
  settingSystemResponseSchema,
} from '../schemas/system-properties.schema';

export const getSettingSytemAllAction = async () => {
  const [error, data] = await safeFetchApi(
    settingSystemAllResponseSchema,
    '/core/settings-system',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching all setting system');
  }

  return data;
};

export const getCurrencyAction = async () => {
  const [error, response] = await safeFetchApi(
    currenciesAllResponseSchema,
    `/core/currencies`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching currency');
  }

  return response?.data || null;
};

export const getCurrenciesAction = async () => {
  const [error, response] = await safeFetchApi(
    currenciesAllResponseSchema,
    `/core/currencies`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching currencies');
  }

  return response?.data || [];
};

export const getSettingSytemAction = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  group?: string;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.type && { type: params.type }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.group && { group: params.group }),
  });

  const [error, response] = await safeFetchApi(
    settingSystemAllResponseSchema,
    `/core/settings-system/group?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching setting system');
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

export const updateSettingSystemAction = async (payload: SettingSystem) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    settingSystemResponseSchema,
    `/core/settings-system/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error Update account plans');
  }

  return data;
};

export const saveSettingSystemAction = async (payload: SettingSystem) => {
  try {
    if (payload.id) {
      return await updateSettingSystemAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving setting system data');
  }
};
