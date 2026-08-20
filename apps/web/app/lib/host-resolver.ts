export type HostType = 'localhost' | 'platform' | 'subdomain' | 'custom';

export interface HostClassification {
  type: HostType;
  slug?: string;
  domain?: string;
}

const PLATFORM_DOMAIN = (
  import.meta.env.VITE_PLATFORM_DOMAIN ?? 'zonastart.com'
).toLowerCase();

const APP_SUBDOMAIN = 'app';
const RESERVED_SLUGS = ['app', 'www', 'api', 'admin'];

export function normalizeHost(host: string): string {
  const withoutPort = host
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .split(':')[0];
  return withoutPort ?? '';
}

export function getPlatformDomain(): string {
  return PLATFORM_DOMAIN;
}

export function classifyHost(hostname?: string): HostClassification {
  const host = normalizeHost(
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : ''),
  );

  if (host === 'localhost' || host === '127.0.0.1') {
    return { type: 'localhost' };
  }

  // Soporte explícito para dominios de plataforma (Producción y Local)
  const isPlatformHost =
    host === PLATFORM_DOMAIN ||
    host === `www.${PLATFORM_DOMAIN}` ||
    host === `${APP_SUBDOMAIN}.${PLATFORM_DOMAIN}` ||
    host === 'zonastart.com' ||
    host === 'app.zonastart.com' ||
    host === 'zonastart.local' ||
    host === 'app.zonastart.local';

  if (isPlatformHost) {
    return { type: 'platform' };
  }

  // Verificación de subdominios (*.zonastart.com o *.zonastart.local)
  const isSubdomainOfPlatform =
    host.endsWith(`.${PLATFORM_DOMAIN}`) ||
    host.endsWith('.zonastart.com') ||
    host.endsWith('.zonastart.local');

  if (isSubdomainOfPlatform) {
    const parts = host.split('.');
    const slug = parts[0];
    if (slug && !RESERVED_SLUGS.includes(slug)) {
      return { type: 'subdomain', slug };
    }
  }

  // Solo los dominios externos (ej. caja.caprebdt.com.ve) llegarán aquí
  return { type: 'custom', domain: host };
}

export function buildSubdomainUrl(slug: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${slug}.${PLATFORM_DOMAIN}${port}`;
}

export function buildPlatformUrl(): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${APP_SUBDOMAIN}.${PLATFORM_DOMAIN}${port}`;
}

export function buildCustomDomainUrl(domain: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${domain}${port}`;
}
