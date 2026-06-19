import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { tenantSettingsService } from '../services/tenant-settings-service';
import type { TenantSetting } from '../schemas/tenant-settings.schema';
import type { TenantSettingsListResponse } from '../schemas/tenant-settings-api.schema';
import type { TenantSettingsFilters } from './use-tenant-settings-filters';

export function useTenantSettingsQuery(
  filters?: TenantSettingsFilters,
): UseQueryResult<TenantSettingsListResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.tenantSettings.list(filters),
    queryFn: () => tenantSettingsService.getAll(filters),
  });
}

export function useTenantSettingByIdQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<TenantSetting> {
  return useQuery({
    queryKey: QUERY_KEYS.tenantSettings.detail(id),
    queryFn: () => tenantSettingsService.getById(id),
    enabled: enabled && !!id,
  });
}
