import { useTenantStore } from '@/stores/tenant.store';
import { useEffect, type ReactNode } from 'react';

const BRAND_CSS_VARS = [
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--ring',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
] as const;

function normalizeHex(hex: string): string {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return value.slice(0, 6).padEnd(6, '0');
}

function luminance(hex: string): number {
  const value = normalizeHex(hex);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastForeground(hex: string): string {
  return luminance(hex) > 0.5 ? '#000000' : '#ffffff';
}

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const primaryColor = useTenantStore((s) => s.tenant?.primaryColor);
  const secondaryColor = useTenantStore((s) => s.tenant?.secondaryColor);
  const faviconUrl = useTenantStore((s) => s.tenant?.faviconUrl);

  useEffect(() => {
    const root = document.documentElement;

    for (const variable of BRAND_CSS_VARS) {
      root.style.removeProperty(variable);
    }

    if (primaryColor) {
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty(
        '--primary-foreground',
        contrastForeground(primaryColor),
      );
      root.style.setProperty('--ring', primaryColor);
      root.style.setProperty('--sidebar-primary', primaryColor);
      root.style.setProperty(
        '--sidebar-primary-foreground',
        contrastForeground(primaryColor),
      );
    }

    if (secondaryColor) {
      root.style.setProperty('--secondary', secondaryColor);
      root.style.setProperty(
        '--secondary-foreground',
        contrastForeground(secondaryColor),
      );
    }
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");

    if (faviconUrl) {
      if (link) {
        link.href = faviconUrl;
        link.type = 'image/png';
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.type = 'image/png';
        newLink.href = faviconUrl;
        document.head.appendChild(newLink);
      }
    } else if (link) {
      link.href = '/favicon.ico';
      link.type = 'image/x-icon';
    }
  }, [faviconUrl]);

  return <>{children}</>;
}
