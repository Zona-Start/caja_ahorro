import { QUERY_KEYS } from '@/lib/query-keys';
import { type QueryClient } from '@tanstack/react-query';
import { tenantsFilterSchema } from '../hooks/use-tenants-filters';
import { tenantsService } from '../services/tenants-service';

export const tenantsListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = tenantsFilterSchema.parse(
      Object.fromEntries(url.searchParams),
    );

    const queryFilters = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      isActive:
        filters.isActive === 'all' ? undefined : filters.isActive === 'true',
      businessType:
        filters.businessType === 'all' ? undefined : filters.businessType,
    };

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.tenants.list(filters),
      queryFn: () => tenantsService.getAll(queryFilters),
    });

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.tenants.count(),
      queryFn: () => tenantsService.getActiveCount(),
    });

    return null;
  };
