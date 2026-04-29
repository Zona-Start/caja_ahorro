import { resfreshTokenAction } from '@/feactures/auth/actions/refresh-token-action';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const getValidAccessToken = cache(async () => {
  const session = await auth();

  if (!session?.access_token) return null;

  const now = Math.floor(Date.now() / 1000);
  // Restamos 10s para tener margen de seguridad
  const isValid = (session.access_expire_in as number) - 10 > now;

  // A. Si es válido, lo retornamos directo
  if (isValid) return session.access_token;

  // B. Si expiró, buscamos la cookie
  const cookieStore = cookies();
  const refreshToken = (await cookieStore).get('refresh_token')?.value;

  if (!refreshToken) return null; // No hay refresh token, fin del juego

  // C. Intentamos refrescar
  const newTokens = await resfreshTokenAction({ token: refreshToken });

  if (!newTokens) {
    // Si falla el refresh (token revocado o expirado), borramos cookie
    (await cookieStore).delete('refresh_token');
    return null;
  }

  // D. Guardamos el nuevo refresh token en cookie y retornamos el access token
  (await cookieStore).set('refresh_token', newTokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return newTokens.access_token;
});
