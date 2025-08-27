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
  console.log('refres', data);

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
  return {
    type: 'SUCCESS',
    tokens: data?.tokens,
  };
};
