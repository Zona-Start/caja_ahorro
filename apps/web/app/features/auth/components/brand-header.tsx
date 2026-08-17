import { useTenantStore } from '@/stores/tenant.store';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
}

export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  const tenant = useTenantStore((s) => s.tenant);

  const logoUrl = tenant?.logoUrl || '/img/logo.png';
  const name = tenant?.name || 'Zona Start';

  return (
    <div className="flex flex-col items-center text-center">
      <img src={logoUrl} alt={name} className="mb-3 h-14 w-auto" />
      <h1 className="text-2xl font-bold">{title ?? name}</h1>
      {subtitle && (
        <p className="text-balance text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
