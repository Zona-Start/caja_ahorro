import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { contributionBatchesService } from '../services/contribution-batches-service';
import type { ContributionBatchesFilters } from './use-contribution-batches-filters';

export function useQueryContributionBatches(
  params: ContributionBatchesFilters,
) {
  return useQuery({
    queryKey: QUERY_KEYS.contributionBatches.list(
      JSON.stringify(params),
    ),
    queryFn: () =>
      contributionBatchesService.getAll({
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        type: params.type,
        movementType: params.movementType,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
  });
}

export function useQueryContributionBatchById(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEYS.contributionBatches.detail(id),
    queryFn: () => contributionBatchesService.getById(id),
    enabled: options?.enabled ?? !!id,
  });
}
