import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const accountingCyclesFilterSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type AccountingCyclesFilters = z.infer<typeof accountingCyclesFilterSchema>;

export function useAccountingCyclesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = accountingCyclesFilterSchema.parse(Object.fromEntries(searchParams));

  const setFilters = (newFilters: Partial<AccountingCyclesFilters>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      } else {
        params.delete(k);
      }
    });
    setSearchParams(params, { preventScrollReset: true });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { preventScrollReset: true });
  };

  return { filters, setFilters, resetFilters };
}
