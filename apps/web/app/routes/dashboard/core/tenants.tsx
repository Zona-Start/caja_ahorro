import TenantsPage from '@/features/core/tenants/pages/tenants-page';
import { tenantsListLoader } from '@/features/core/tenants/loaders/tenants-loader';
import { queryClient } from '@/lib/query-client';
import type { Route } from './+types/tenants';

export function clientLoader({ request }: Route.LoaderArgs) {
  return tenantsListLoader(queryClient)({ request });
}

export default TenantsPage;
