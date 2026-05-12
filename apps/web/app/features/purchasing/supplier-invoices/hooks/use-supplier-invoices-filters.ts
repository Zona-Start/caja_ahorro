import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { z } from 'zod';

export const supplierInvoicesFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.coerce.number().optional(),
});

export interface SupplierInvoicesFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  supplierId?: number;
}

export function useSupplierInvoicesFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));
  const [supplierId, setSupplierId] = useQueryState(
    'supplierId',
    parseAsInteger,
  );

  const filters: SupplierInvoicesFilters = {
    page,
    limit,
    search,
    status,
    supplierId: supplierId ?? undefined,
  };

  const setFilters = (newFilters: Partial<SupplierInvoicesFilters>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search || null);
    if (newFilters.status !== undefined) setStatus(newFilters.status || null);
    if (newFilters.supplierId !== undefined) setSupplierId(newFilters.supplierId ?? null);
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
    setSupplierId(null);
  };

  return { filters, setFilters, clearFilters };
}
