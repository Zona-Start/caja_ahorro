import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { type TenantsFilters } from './use-tenants-filters';
import { tenantsService } from '../services/tenants-service';
import { type Tenant } from '../schemas/tenants.schema';

const mapFiltersToApiParams = (filters: TenantsFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  isActive:
    filters.isActive === 'all' ? undefined : filters.isActive === 'true',
  businessType:
    filters.businessType === 'all' ? undefined : filters.businessType,
});

export function useTenantsQuery(
  filters: TenantsFilters,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.list(filters),
    queryFn: () => tenantsService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useTenantActiveCountQuery(
  enabled: boolean = true,
): UseQueryResult<number> {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.count(),
    queryFn: () => tenantsService.getActiveCount(),
    enabled,
  });
}

export function useTenantQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Tenant> {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.detail(id),
    queryFn: () => tenantsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useTenantByRifQuery(
  rif: string,
  enabled: boolean = true,
): UseQueryResult<Tenant | null> {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.byRif(rif),
    queryFn: () => tenantsService.getByRif(rif),
    enabled: enabled && rif.trim().length > 0,
    retry: false,
  });
}

export function useTenantModulesQuery(
  tenantId: string,
  enabled: boolean = true,
): UseQueryResult<Array<{ id: string; moduleCode: string; status: string }>> {
  return useQuery({
    queryKey: QUERY_KEYS.tenants.modules(tenantId),
    queryFn: () => tenantsService.getModules(tenantId),
    enabled: enabled && !!tenantId,
  });
}

