import type { APIRoute } from 'astro';
import { ensureAccess } from '../../../lib/auth';
import { json } from '../../../lib/http';
import { apiGet } from '../../../lib/portal-api';

export const GET: APIRoute = async ({ url, cookies }) => {
  const token = await ensureAccess(cookies);
  if (!token) return json({ message: 'No autenticado' }, 401);

  const stateId = url.searchParams.get('stateId');
  const { status, data } = await apiGet(
    `/catalog/municipalities?stateId=${stateId}`,
    token,
  );
  return json(data ?? [], status);
};
