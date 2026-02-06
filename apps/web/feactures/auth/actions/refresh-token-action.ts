'use server';
import { safeFetchRefresh } from '@/lib/fetch.refreshToken';
import {
  RefreshTokenResponseSchema,
  RefreshTokenValue,
} from '../schemas/refreshToken';

export const resfreshTokenAction = async (refreshToken: RefreshTokenValue) => {
  const [error, data] = await safeFetchRefresh(
    RefreshTokenResponseSchema,
    '/auth/refresh-token',
    'POST',
    refreshToken,
  );

  if (error || !data) {
    throw new Error('Refresh failed');
  }

  return data;
};
