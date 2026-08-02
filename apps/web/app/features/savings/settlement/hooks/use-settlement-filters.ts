import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const settlementFilterSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SettlementFilters = z.infer<typeof settlementFilterSchema>;

export function useSettlementFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = settlementFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<SettlementFilters>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      } else {
        params.delete(k);
      }
    });
    if (!('page' in newFilters)) {
      params.set('page', '1');
    }
    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}
