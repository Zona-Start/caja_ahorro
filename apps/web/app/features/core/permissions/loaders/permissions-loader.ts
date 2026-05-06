import { QUERY_KEYS } from '@/lib/query-keys';
import { type QueryClient } from '@tanstack/react-query';
import { permissionsService } from '../services/permissions-service';

export const permissionsListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.permissions.list(),
      queryFn: () => permissionsService.getAll(),
    });

    return null;
  };