import RolesList from '@/features/core/roles/components/roles-list';
import { rolesListLoader } from '@/features/core/roles/loaders/roles-loader';
import type { Route } from './+types/roles';

export function clientLoader({ request }: Route.LoaderArgs) {
  return rolesListLoader({ request } as any);
}

export default function RolesPage() {
  return <RolesList />;
}
