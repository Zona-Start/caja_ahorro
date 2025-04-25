'use server';

import { safeFetchApi } from '@/lib';
import {
  currenciesAllResponseSchema,
  exchangeRateAllResponseSchema,
  settingSystemAllResponseSchema,
} from './settting-system-config.schema';

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

  return data?.data || null;
};

export const getCurrencyAction = async () => {
  const [error, response] = await safeFetchApi(
    currenciesAllResponseSchema,
    `/core/currencies/config`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching currency');
  }

  return response?.data || null;
};

export const getExchangeRateAction = async () => {
  const [error, response] = await safeFetchApi(
    exchangeRateAllResponseSchema,
    `/core/exchange-rates/config`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching currency');
  }

  const responseData = response?.data.map((item) => ({
    ...item,
    date: new Date(item.date).toISOString(),
  }));

  return responseData || null;
};
