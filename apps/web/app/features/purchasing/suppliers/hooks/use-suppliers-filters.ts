import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { z } from 'zod';

export const suppliersFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export interface SuppliersFilters {
  page: number;
  limit: number;
  search: string;
}

export function useSuppliersFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );

  const filters: SuppliersFilters = { page, limit, search };

  const setFilters = (newFilters: Partial<SuppliersFilters>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search || null);
    if (newFilters.page !== undefined) {
      setPage(newFilters.page);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch(null);
  };

  return { filters, setFilters, clearFilters };
}
