import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const expenseFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  paymentSource: z.string().optional(),
  type: z.string().optional(),
});

export type ExpenseFilters = z.infer<typeof expenseFilterSchema>;

export function useExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = expenseFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<ExpenseFilters>) => {
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
