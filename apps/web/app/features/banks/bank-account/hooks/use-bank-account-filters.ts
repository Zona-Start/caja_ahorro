import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const bankAccountFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  accountType: z.string().optional(),
  currencyCode: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type BankAccountFilters = z.infer<typeof bankAccountFilterSchema>;

export function useBankAccountFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = bankAccountFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<BankAccountFilters>) => {
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
