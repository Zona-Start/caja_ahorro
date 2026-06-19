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
  tenantId: z.string().optional(),
  state: z.string().optional(),
  category: z.string().optional(),
});

export type SuppliersFilters = z.infer<typeof suppliersFilterSchema>;

export function useSuppliersFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [tenantId, setTenantId] = useQueryState('tenant_id', parseAsString.withDefault(''));
  const [state, setState] = useQueryState('state', parseAsString.withDefault(''));
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault(''));

  const filters: SuppliersFilters = { page, limit, search, tenantId, state, category };

  const setFilters = (newFilters: Partial<SuppliersFilters>) => {
    if ('search' in newFilters) setSearch(newFilters.search || null);
    if ('tenantId' in newFilters) setTenantId(newFilters.tenantId || null);
    if ('state' in newFilters) setState(newFilters.state || null);
    if ('category' in newFilters) setCategory(newFilters.category || null);
    if (newFilters.page !== undefined) {
      setPage(newFilters.page);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch(null);
    setTenantId(null);
    setState(null);
    setCategory(null);
  };

  return { filters, setFilters, clearFilters };
}
