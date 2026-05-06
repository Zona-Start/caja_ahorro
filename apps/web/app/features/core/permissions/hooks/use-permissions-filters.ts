import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const permissionsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type PermissionsFilters = z.infer<typeof permissionsFilterSchema>;

export function usePermissionsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = permissionsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<PermissionsFilters>) => {
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
    params.set('limit', '10');
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}