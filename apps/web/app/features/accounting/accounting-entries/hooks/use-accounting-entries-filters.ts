import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const accountingEntriesFilterSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  accountingCycleId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type AccountingEntriesFilters = z.infer<typeof accountingEntriesFilterSchema>;

export function useAccountingEntriesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = accountingEntriesFilterSchema.parse(Object.fromEntries(searchParams));

  const setFilters = (newFilters: Partial<AccountingEntriesFilters>) => {
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
