import PermissionsList from '@/features/core/permissions/components/permissions-list';
import { permissionsListLoader } from '@/features/core/permissions/loaders/permissions-loader';
import type { Route } from './+types/permissions';

export function ClientLoader({ request }: Route.LoaderArgs) {
  return permissionsListLoader({ request } as any);
}

export default function PermissionsPage() {
  return <PermissionsList />;
}
