/** Marca del tenant (branding) usada para el theming del portal. */
export interface TenantBrand {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

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

/** Color de texto con contraste (mismo criterio que el ERP). */
export function contrastForeground(hex: string): string {
  return luminance(hex) > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Variables CSS de marca (--primary/--secondary/--ring) derivadas del tenant,
 * equivalentes a las que aplica `TenantThemeProvider` en el ERP.
 */
export function brandCssVars(brand: TenantBrand | null): string {
  if (!brand) return '';
  const vars: string[] = [];
  if (brand.primaryColor) {
    vars.push(`--primary:${brand.primaryColor}`);
    vars.push(`--primary-foreground:${contrastForeground(brand.primaryColor)}`);
    vars.push(`--ring:${brand.primaryColor}`);
  }
  if (brand.secondaryColor) {
    vars.push(`--secondary:${brand.secondaryColor}`);
    vars.push(
      `--secondary-foreground:${contrastForeground(brand.secondaryColor)}`,
    );
  }
  return vars.join(';');
}
