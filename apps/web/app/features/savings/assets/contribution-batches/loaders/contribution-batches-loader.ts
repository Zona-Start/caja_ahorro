import type { ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { contributionBatchesService } from '../services/contribution-batches-service';
import { contributionBatchesFilterSchema } from '../hooks/use-contribution-batches-filters';

export const contributionBatchesLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const paramsParsed = contributionBatchesFilterSchema.parse({
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 10,
      search: url.searchParams.get('search') || undefined,
      status: url.searchParams.get('status') || undefined,
      type: url.searchParams.get('type') || undefined,
      movementType: url.searchParams.get('movementType') || undefined,
      sortBy: url.searchParams.get('sortBy') || 'entryDate',
      sortOrder:
        (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    });

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.contributionBatches.list(
        JSON.stringify(paramsParsed),
      ),
      queryFn: () => contributionBatchesService.getAll(paramsParsed),
    });
  };
