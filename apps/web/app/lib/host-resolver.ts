export type HostType = 'localhost' | 'platform' | 'subdomain' | 'custom';

export interface HostClassification {
  type: HostType;
  slug?: string;
  domain?: string;
}

const PLATFORM_DOMAIN = (
  import.meta.env.VITE_PLATFORM_DOMAIN ?? 'zonastart.local'
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

  if (
    host === PLATFORM_DOMAIN ||
    host === `www.${PLATFORM_DOMAIN}` ||
    host === `${APP_SUBDOMAIN}.${PLATFORM_DOMAIN}`
  ) {
    return { type: 'platform' };
  }

  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const slug = host.slice(0, -(PLATFORM_DOMAIN.length + 1));
    if (slug && !slug.includes('.') && !RESERVED_SLUGS.includes(slug)) {
      return { type: 'subdomain', slug };
    }
  }

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
