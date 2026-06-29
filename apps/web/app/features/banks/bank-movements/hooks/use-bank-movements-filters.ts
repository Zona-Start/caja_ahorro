import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const bankMovementsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reconciliationStatus: z.string().optional(),
  internalLinkStatus: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type BankMovementsFilters = z.infer<typeof bankMovementsFilterSchema>;

export function useBankMovementsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = bankMovementsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<BankMovementsFilters>) => {
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
