import { PORTAL_API_URL } from 'astro:env/server';
import type { TenantBrand } from './theme';

interface CacheEntry {
  brand: TenantBrand | null;
  at: number;
}

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

/**
 * Resuelve la marca del tenant por host llamando a portal-api (server-side).
 * Cachea en memoria 5 min. Devuelve null si no resuelve o hay error.
 */
export async function resolveTenant(host: string): Promise<TenantBrand | null> {
  const key = host.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.brand;

  try {
    const res = await fetch(
      `${PORTAL_API_URL}/tenant/resolve?host=${encodeURIComponent(host)}`,
    );
    const brand = res.ok ? ((await res.json()) as TenantBrand | null) : null;
    cache.set(key, { brand, at: Date.now() });
    return brand;
  } catch {
    return null;
  }
}
