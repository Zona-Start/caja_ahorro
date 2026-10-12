import type { APIRoute } from 'astro';
import { ensureAccess } from '../../../lib/auth';
import { json } from '../../../lib/http';
import { apiSend } from '../../../lib/portal-api';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = await ensureAccess(cookies);
  if (!token) return json({ message: 'No autenticado' }, 401);

  const body = await request.json().catch(() => ({}));
  const { status, data } = await apiSend('/me/profile', 'PATCH', body, token);
  return json(data ?? {}, status);
};
