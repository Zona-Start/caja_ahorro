import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { associatesService } from '../services/associates-service';
import { associatesFilterSchema } from '../hooks/use-associates-filters';

export const associatesListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = associatesFilterSchema.parse(Object.fromEntries(url.searchParams));

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.associates.list(filters),
      queryFn: () => associatesService.getAll(filters),
    });
  };

export const associateDetailLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: { id: string } }) => {
    const id = params.id;
    if (!id) return null;

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.associates.detail(id),
      queryFn: () => associatesService.getById(id),
    });
  };
