import { QUERY_KEYS } from '@/lib/query-keys';
import { type QueryClient } from '@tanstack/react-query';
import { rolesFilterSchema } from '../hooks/use-roles-filters';
import { rolesService } from '../services/roles-service';

export const rolesListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = rolesFilterSchema.parse(
      Object.fromEntries(url.searchParams),
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.roles.list(filters),
      queryFn: () => rolesService.getAll(filters),
    });

    return null;
  };