import type { AstroCookies } from 'astro';
import { apiGet, apiRefresh } from './portal-api';
import { getSession, setSession } from './session';

/**
 * Devuelve un access token válido: usa el actual o, si no hay, intenta
 * refrescar con la cookie `p_rt`. Devuelve null si no hay sesión utilizable.
 */
export async function ensureAccess(
  cookies: AstroCookies,
): Promise<string | null> {
  const { access, refresh } = getSession(cookies);
  if (access) return access;
  if (!refresh) return null;

  const renewed = await apiRefresh(refresh);
  if (!renewed) return null;

  setSession(cookies, renewed.accessToken, renewed.refreshToken);
  return renewed.accessToken;
}

/**
 * GET autenticado con refresco transparente: si el access expira (401),
 * renueva con el refresh y reintenta una vez.
 */
export async function fetchAuthed(
  cookies: AstroCookies,
  path: string,
): Promise<{ status: number; data: unknown }> {
  let { access, refresh } = getSession(cookies);

  if (!access && refresh) {
    const renewed = await apiRefresh(refresh);
    if (renewed) {
      access = renewed.accessToken;
      refresh = renewed.refreshToken;
      setSession(cookies, access, refresh);
    }
  }

  if (!access) return { status: 401, data: null };

  let res = await apiGet(path, access);
  if (res.status === 401 && refresh) {
    const renewed = await apiRefresh(refresh);
    if (renewed) {
      access = renewed.accessToken;
      refresh = renewed.refreshToken;
      setSession(cookies, access, refresh);
      res = await apiGet(path, access);
    }
  }

  return res;
}
