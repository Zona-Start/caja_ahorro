'use server';

import { safeFetchApi } from '@/lib';
import { logoutResponseSchema } from '../schemas/logout';

export const logoutAction = async (user_id: string) => {
  const payload = { user_id };

  const [error, data] = await safeFetchApi(
    logoutResponseSchema,
    '/auth/sign-out',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    // Devuelve un objeto con la propiedad 'type' para que el callback de NextAuth lo reconozca como un error
    return {
      type: 'API_ERROR',
      message: error.message,
    };
  }
};
