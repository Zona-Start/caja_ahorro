import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const loansPaidFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  bank: z.string().optional(),
  type: z.string().optional(),
  method: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type LoansPaidFilters = z.infer<typeof loansPaidFilterSchema>;

export function useLoansPaidFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = loansPaidFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<LoansPaidFilters>) => {
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
    params.set('sortBy', 'id');
    params.set('sortOrder', 'desc');
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}
