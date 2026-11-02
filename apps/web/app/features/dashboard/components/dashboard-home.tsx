import { useTenantStore } from '@/stores/tenant.store';

/**
 * Vista de inicio simplificada: únicamente el logo del tenant centrado.
 * Los indicadores del dashboard se conservan en `DashboardIndicators`
 * (routes/dashboard/index.tsx) para poder restaurarlos fácilmente.
 */
export function DashboardHome() {
  const tenant = useTenantStore((state) => state.tenant);
  const logoUrl = tenant?.logoUrl || '/img/logo.png';
  const name = tenant?.name || 'Zona Start';

  return (
    <div className="flex min-h-[calc(100dvh-var(--header-height)-3rem)] w-full items-center justify-center">
      <img
        src={logoUrl}
        alt={name}
        className="h-56 w-auto max-w-full object-contain md:h-72"
      />
    </div>
  );
}
