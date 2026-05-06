import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { rolesService } from '@/features/core/roles/services/roles-service';
import type { Role } from '@/features/core/roles/schemas/roles.schema';

export function useRolesByTenant(
  tenantId: string | null,
  enabled: boolean = true,
): UseQueryResult<{ data: Role[]; total: number }> {
  return useQuery({
    queryKey: QUERY_KEYS.roles.list({ tenantId, limit: 100 }),
    queryFn: () => rolesService.getAll({ tenantId, limit: 100 }),
    enabled: enabled && !!tenantId,
  });
}

export function useAllPermissions(
  enabled: boolean = true,
): UseQueryResult<{ id: string; name: string; resource: string; action: string }[]> {
  return useQuery({
    queryKey: QUERY_KEYS.roles.permissions(),
    queryFn: () => rolesService.getPermissions(),
    enabled,
  });
}

export function useAvailablePermissions(
  roleId: string | null,
  enabled: boolean = true,
): UseQueryResult<{ id: string; name: string; resource: string; action: string }[]> {
  return useQuery({
    queryKey: ['available-permissions', roleId],
    queryFn: async () => {
      const allPermissions = await rolesService.getPermissions();
      
      if (!roleId) {
        return allPermissions;
      }

      try {
        const rolePermissions = await rolesService.getRolePermissions(roleId);
        const rolePermissionIds = new Set(rolePermissions.map((p: any) => p.permissionId || p.id));

        return allPermissions.filter(
          (p: any) => !rolePermissionIds.has(p.id),
        );
      } catch (error) {
        console.error('Error fetching role permissions:', error);
        return allPermissions;
      }
    },
    enabled: enabled,
  });
}