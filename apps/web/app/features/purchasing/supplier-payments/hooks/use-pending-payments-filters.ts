import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const pendingPaymentsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.string().optional(),
});

export type PendingPaymentsFilters = z.infer<typeof pendingPaymentsFilterSchema>;

export function usePendingPaymentsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = pendingPaymentsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<PendingPaymentsFilters>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    }
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
