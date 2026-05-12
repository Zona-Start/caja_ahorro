import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SuppliersFilters } from './use-suppliers-filters';
import { suppliersService } from '../services/suppliers-service';
import type { Supplier } from '../schemas/suppliers.schema';

const mapFiltersToApiParams = (filters: SuppliersFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
});

export function useSuppliersQuery(
  filters: SuppliersFilters,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers.list(filters),
    queryFn: () => suppliersService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useSuppliersAllQuery(
  enabled: boolean = true,
): UseQueryResult<Supplier[]> {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers.all,
    queryFn: () => suppliersService.getAllActive(),
    enabled,
  });
}

export function useSupplierQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Supplier> {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers.detail(id),
    queryFn: () => suppliersService.getById(id),
    enabled: enabled && !!id,
  });
}
