import { tenantApi } from '@/lib/tenant-api';
import { useTenantStore } from '@/stores/tenant.store';
import { useEffect, type ReactNode } from 'react';

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  useEffect(() => {
    let cancelled = false;

    tenantApi
      .resolveHost(window.location.hostname)
      .then((payload) => {
        if (!cancelled) useTenantStore.getState().setResolved(payload);
      })
      .catch(() => {
        if (!cancelled) useTenantStore.getState().setError();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
