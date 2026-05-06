import UsersList from '@/features/core/users/components/users-list';
import { usersListLoader } from '@/features/core/users/loaders/users-loader';
import type { Route } from './+types/users';

export function clientLoader({ request }: Route.LoaderArgs) {
  return usersListLoader({ request } as any);
}

export default function UsersPage() {
  return <UsersList />;
}
