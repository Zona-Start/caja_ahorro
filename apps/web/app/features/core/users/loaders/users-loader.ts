import { QUERY_KEYS } from '@/lib/query-keys';
import { type QueryClient } from '@tanstack/react-query';
import { usersFilterSchema } from '../hooks/use-users-filters';
import { usersService } from '../services/users-service';

export const usersListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = usersFilterSchema.parse(
      Object.fromEntries(url.searchParams),
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.users.list(filters),
      queryFn: () => usersService.getAll(filters),
    });

    return null;
  };