import TenantsList from '@/features/core/tenants/components/tenants-list';
import { tenantsListLoader } from '@/features/core/tenants/loaders/tenants-loader';
import type { Route } from './+types/tenants';

export function clientLoader({ request }: Route.LoaderArgs) {
  return tenantsListLoader({ request } as any);
}

export default function TenantsPage() {
  return <TenantsList />;
}
