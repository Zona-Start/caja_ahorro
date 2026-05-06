import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { RolesFilters } from './use-roles-filters';
import { rolesService } from '../services/roles-service';
import type { Role, Permission } from '../schemas/roles.schema';

export function useRolesQuery(
  filters: RolesFilters,
): UseQueryResult<{ data: Role[]; total: number; page: number; limit: number; totalPages: number }> {
  return useQuery({
    queryKey: QUERY_KEYS.roles.list(filters),
    queryFn: () => rolesService.getAll(filters),
  });
}

export function useRoleQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Role> {
  return useQuery({
    queryKey: QUERY_KEYS.roles.detail(id),
    queryFn: () => rolesService.getById(id),
    enabled: enabled && !!id,
  });
}

export function usePermissionsQuery(): UseQueryResult<Permission[]> {
  return useQuery({
    queryKey: QUERY_KEYS.roles.permissions(),
    queryFn: () => rolesService.getPermissions(),
    staleTime: 5 * 60 * 1000,
  });
}