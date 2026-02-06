'use server';
import { safeFetchApi } from '@/lib';
import { cookies } from 'next/headers';
import { loginResponseSchema, UserFormValue } from '../schemas/login';

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
    // 2. GUARDAR REFRESH TOKEN EN COOKIE (La clave del cambio)

    (await cookies()).set(
      'refresh_token',
      String(data?.tokens?.refresh_token),
      {
        httpOnly: true, // JavaScript no puede leerla
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // Ej: 7 días (debe coincidir con tu backend)
      },
    );

    return data;
  }
};

// export const login = async (values: z.infer<typeof formSchema>) => {
//   try {
//     await signIn('credentials', {
//       username: values.username,
//       password: values.password,
//       redirect: false,
//     });

//     return { success: true };
//   } catch (error) {
//     if (error instanceof AuthError) {
//       return { error: error.cause?.err?.message };
//     }
//     return { error: 'error 500' };
//   }
// };
