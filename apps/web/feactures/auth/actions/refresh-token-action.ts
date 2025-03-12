'use server';
import { safeFetchApi } from '@/lib';
import {
  RefreshTokenResponseSchema,
  RefreshTokenValue,
} from '../schemas/refreshToken';

export const resfreshTokenAction = async (refreshToken: RefreshTokenValue) => {
  const [error, data] = await safeFetchApi(
    RefreshTokenResponseSchema,
    '/auth/refreshToken',
    'POST',
    refreshToken,
  );
  if (error) {
    console.error('Error:', error);
  } else {
    return data;
  }
};
