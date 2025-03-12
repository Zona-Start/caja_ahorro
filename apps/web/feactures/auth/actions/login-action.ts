'use server';
import { safeFetchApi } from '@/lib';
import { loginResponseSchema, UserFormValue } from '../schemas/login';

export const SignInAction = async (payload: UserFormValue) => {
  const [error, data] = await safeFetchApi(
    loginResponseSchema,
    '/auth/sign-in',
    'POST',
    payload,
  );
  if (error) {
    console.error('Error:', error);
  } else {
    return data;
  }
};
