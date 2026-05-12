import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { z } from 'zod';

export const supplierPaymentsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export interface SupplierPaymentsFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
}

export function useSupplierPaymentsFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));

  const filters: SupplierPaymentsFilters = { page, limit, search, status };

  const setFilters = (newFilters: Partial<SupplierPaymentsFilters>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search || null);
    if (newFilters.status !== undefined) setStatus(newFilters.status || null);
    if (newFilters.page !== undefined) {
      setPage(newFilters.page);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch(null);
    setStatus(null);
  };

  return { filters, setFilters, clearFilters };
}
