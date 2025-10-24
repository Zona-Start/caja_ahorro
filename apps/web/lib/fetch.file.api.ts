'use server';

const API_URL = process.env.API_URL ?? '';

export async function fetchApiFile(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const token = session?.access_token;

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Intenta leer JSON; si falla, usa texto
    let msg = 'API Error';
    try {
      const err = await res.clone().json();
      msg = err.message ?? msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }

  return res.blob(); // ← Blob directo
}
