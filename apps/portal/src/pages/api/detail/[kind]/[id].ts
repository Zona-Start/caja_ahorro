import type { APIRoute } from 'astro';
import { ensureAccess } from '../../../../lib/auth';
import { json } from '../../../../lib/http';
import { apiGet } from '../../../../lib/portal-api';

const KINDS: Record<string, string> = {
  prestamo: 'prestamo',
  credito: 'credito',
  retiro: 'retiro',
};

export const GET: APIRoute = async ({ params, cookies }) => {
  const kind = params.kind ?? '';
  const id = params.id ?? '';

  if (!KINDS[kind] || !id) return json({ message: 'Solicitud inválida' }, 400);

  const token = await ensureAccess(cookies);
  if (!token) return json({ message: 'No autenticado' }, 401);

  const { status, data } = await apiGet(`/me/${KINDS[kind]}/${id}`, token);
  return json(data ?? {}, status);
};
