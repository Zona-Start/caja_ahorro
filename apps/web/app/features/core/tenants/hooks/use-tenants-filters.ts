import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { z } from 'zod';

const activeOptions = ['all', 'true', 'false'] as const;
const businessTypeOptions = ['all', 'CAJA_AHORRO', 'EMPRESA_COMERCIAL'] as const;

export const tenantsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(activeOptions).default('true'),
  businessType: z.enum(businessTypeOptions).optional(),
});

export interface TenantsFilters {
  page: number;
  limit: number;
  search: string;
  isActive: (typeof activeOptions)[number];
  businessType?: (typeof businessTypeOptions)[number];
}

export function useTenantsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      isActive: parseAsStringLiteral(activeOptions).withDefault('true'),
      businessType: parseAsStringLiteral(businessTypeOptions).withDefault('all'),
    },
    { shallow: false },
  );

  const updateFilters = (newFilters: Partial<TenantsFilters>) => {
    const resetPage = newFilters.page === undefined;
    setFilters({
      ...filters,
      ...newFilters,
      page: resetPage ? 1 : (newFilters.page ?? filters.page),
      search: newFilters.search !== undefined ? newFilters.search : filters.search,
      isActive: newFilters.isActive !== undefined ? newFilters.isActive : filters.isActive,
      businessType: newFilters.businessType !== undefined ? (newFilters.businessType ?? 'all') : filters.businessType,
      limit: newFilters.limit ?? filters.limit,
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      search: null,
      isActive: 'true',
      businessType: 'all',
    });
  };

  return { filters, setFilters: updateFilters, clearFilters };
}
