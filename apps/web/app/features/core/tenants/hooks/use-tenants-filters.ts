import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const tenantsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(['all', 'true', 'false']).default('true'),
});

export type TenantsFilters = z.infer<typeof tenantsFilterSchema>;

export function useTenantsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = tenantsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<TenantsFilters>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    if (!('page' in newFilters)) {
      params.set('page', '1');
    }

    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(filters.limit || 10));
    params.set('isActive', 'true');
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}

