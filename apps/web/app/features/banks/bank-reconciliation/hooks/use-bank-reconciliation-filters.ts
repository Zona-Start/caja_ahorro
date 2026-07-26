import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const bankReconciliationFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  bankAccountId: z.string().uuid().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type BankReconciliationFilters = z.infer<
  typeof bankReconciliationFilterSchema
>;

export function useBankReconciliationFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = bankReconciliationFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<BankReconciliationFilters>) => {
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
