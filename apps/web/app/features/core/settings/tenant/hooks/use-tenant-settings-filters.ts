import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const tenantSettingsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  tenantId: z.string().optional(),
  category: z.string().optional(),
});

export type TenantSettingsFilters = z.infer<typeof tenantSettingsFilterSchema>;

export function useTenantSettingsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = tenantSettingsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<TenantSettingsFilters>) => {
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
