import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const bankDirectoryFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type BankDirectoryFilters = z.infer<typeof bankDirectoryFilterSchema>;

export function useBankDirectoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = bankDirectoryFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<BankDirectoryFilters>) => {
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

  const resetFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(filters.limit || 10));
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, resetFilters };
}
