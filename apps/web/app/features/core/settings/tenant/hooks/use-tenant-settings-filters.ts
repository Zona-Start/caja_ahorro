import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const tenantSettingsFilterSchema = z.object({
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

    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}