import type { APIRoute } from 'astro';
import { apiLogin } from '../../lib/portal-api';
import { setSession } from '../../lib/session';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const form = await request.formData();
  const identifier = String(form.get('identifier') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!identifier || !password) return redirect('/login?error=1');

  // El tenant se resuelve por host; se envía para que el login sea inequívoco.
  const tenantId = locals.tenant?.id;
  const result = await apiLogin(identifier, password, tenantId);

  if (!result.ok || !result.refreshToken) {
    return redirect('/login?error=1');
  }

  setSession(cookies, result.accessToken, result.refreshToken);
  return redirect('/dashboard');
};
