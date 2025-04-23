'use server';
import { safeFetchApi } from '@/lib';
import { AuthError } from 'next-auth';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import {
  formSchema,
  loginResponseSchema,
  UserFormValue,
} from '../schemas/login';

export const SignInAction = async (payload: UserFormValue) => {
  const [error, data] = await safeFetchApi(
    loginResponseSchema,
    '/auth/sign-in',
    'POST',
    payload,
  );
  if (error) {
    return error;
  } else {
    return data;
  }
};

export const login = async (values: z.infer<typeof formSchema>) => {
  try {
    await signIn('credentials', {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.log(error);

    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message };
    }
    return { error: 'error 500' };
  }
};
