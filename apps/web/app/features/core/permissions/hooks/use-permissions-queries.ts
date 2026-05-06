import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { permissionsService, type PaginatedResponse } from '../services/permissions-service';
import type { Permission } from '../schemas/permissions.schema';
import type { PermissionsFilters } from './use-permissions-filters';

export function usePermissionsQuery(
  filters?: PermissionsFilters,
): UseQueryResult<PaginatedResponse<Permission>> {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.list(filters),
    queryFn: () => permissionsService.getAll(filters),
  });
}

export function usePermissionQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Permission> {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.detail(id),
    queryFn: () => permissionsService.getById(id),
    enabled: enabled && !!id,
  });
}