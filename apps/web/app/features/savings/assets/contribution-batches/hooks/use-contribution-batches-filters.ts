import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const contributionBatchesFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  movementType: z.string().optional(),
  sortBy: z.string().default('entryDate').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type ContributionBatchesFilters = z.infer<
  typeof contributionBatchesFilterSchema
>;

export function useContributionBatchesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = contributionBatchesFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<ContributionBatchesFilters>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    }
    if (!('page' in newFilters)) params.set('page', '1');
    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(filters.limit || 10));
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}
