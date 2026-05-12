import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { z } from 'zod';

const activeOptions = ['all', 'true', 'false'] as const;

// Schema kept for the loader (server-side URL parsing)
export const tenantsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(activeOptions).default('true'),
});

export interface TenantsFilters {
  page: number;
  limit: number;
  search: string;
  isActive: (typeof activeOptions)[number];
}

export function useTenantsFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [isActive, setIsActive] = useQueryState(
    'isActive',
    parseAsStringLiteral(activeOptions).withDefault('true'),
  );

  const filters: TenantsFilters = { page, limit, search, isActive };

  const setFilters = (newFilters: Partial<TenantsFilters>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search || null);
    if (newFilters.isActive !== undefined)
      setIsActive(newFilters.isActive ?? null);
    // Reset page to 1 when changing filters, unless page is explicitly set
    if (newFilters.page !== undefined) {
      setPage(newFilters.page);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch(null);
    setIsActive('true');
  };

  return { filters, setFilters, clearFilters };
}
