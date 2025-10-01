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

  if (error) {
    console.error('Error:', error);
    // Devuelve un objeto con la propiedad 'type' para que el callback de NextAuth lo reconozca como un error
    return {
      type: 'API_ERROR',
      message: error.message || 'Failed to refresh token',
      // No se devuelven tokens en caso de error
    };
  }
  // En caso de éxito, devuelve el objeto que contiene los tokens

  const tokens = {
    access_token: data?.access_token,
    access_expire_in: data?.access_expire_in,
    refresh_token: data?.refresh_token,
    refresh_expire_in: data?.refresh_expire_in,
  };
  return {
    type: 'SUCCESS',
    tokens: tokens,
  };
};
