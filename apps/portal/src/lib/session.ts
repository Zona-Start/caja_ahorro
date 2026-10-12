import type { AstroCookies } from 'astro';

export const ACCESS_COOKIE = 'p_at';
export const REFRESH_COOKIE = 'p_rt';

export interface PortalSession {
  access: string | null;
  refresh: string | null;
}

export function getSession(cookies: AstroCookies): PortalSession {
  return {
    access: cookies.get(ACCESS_COOKIE)?.value ?? null,
    refresh: cookies.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export function setSession(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string,
): void {
  const secure = import.meta.env.PROD;
  cookies.set(ACCESS_COOKIE, accessToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 60 * 15, // 15 min
  });
  cookies.set(REFRESH_COOKIE, refreshToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
}
