import { PORTAL_API_URL } from 'astro:env/server';

export interface PortalUser {
  accountId: string;
  fullname: string;
  cedula: string;
  mustChangePassword: boolean;
  tenant: { id: string; name: string; slug?: string | null } | null;
}

export interface Statement {
  cedula: string;
  fullname: string;
  nationality: string;
  status: string;
  accountNumber: string | null;
  bankName: string | null;
  totalHaberes: string;
  paymentCapacity: string;
  disponibility: string;
  haberesContribution: string;
  haberesVoluntary: string;
  haberesEmployer: string;
  surpluses: string;
  isPayrollCredit: boolean;
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|[,\\s])${name}=([^;,\\n]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

/** Inicia sesión contra portal-api (server-side). */
export async function apiLogin(
  identifier: string,
  password: string,
  tenantId?: string,
) {
  const res = await fetch(`${PORTAL_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password, ...(tenantId ? { tenantId } : {}) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { ok: false as const, message: errorMessage(body, 'Credenciales inválidas') };
  }

  const data = (await res.json()) as { accessToken: string; user: PortalUser };
  const refreshToken = parseCookie(res.headers.get('set-cookie'), 'portal_session');
  return {
    ok: true as const,
    accessToken: data.accessToken,
    user: data.user,
    refreshToken,
  };
}

/** Renueva la sesión usando el refresh token. */
export async function apiRefresh(refreshToken: string) {
  const res = await fetch(`${PORTAL_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: `portal_session=${refreshToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string };
  const newRefresh =
    parseCookie(res.headers.get('set-cookie'), 'portal_session') ?? refreshToken;
  return { accessToken: data.accessToken, refreshToken: newRefresh };
}

/** GET autenticado. Devuelve el status para poder manejar el 401. */
export async function apiGet<T = unknown>(
  path: string,
  accessToken: string,
): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${PORTAL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = res.ok ? ((await res.json()) as T) : null;
  return { status: res.status, data };
}

/** Envío autenticado (POST/PATCH). Devuelve status + cuerpo (aunque no sea 2xx). */
export async function apiSend<T = unknown>(
  path: string,
  method: 'POST' | 'PATCH',
  body: unknown,
  accessToken: string,
): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${PORTAL_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, data };
}

