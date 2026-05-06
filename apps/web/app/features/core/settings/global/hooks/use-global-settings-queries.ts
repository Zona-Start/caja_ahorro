import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { globalSettingsService, type PaginatedResponse } from '../services/global-settings-service';
import type { GlobalSetting } from '../schemas/global-settings.schema';
import type { GlobalSettingsFilters } from './use-global-settings-filters';

export function useGlobalSettingsQuery(
  filters?: GlobalSettingsFilters,
): UseQueryResult<PaginatedResponse<GlobalSetting>> {
  return useQuery({
    queryKey: QUERY_KEYS.globalSettings.list(filters),
    queryFn: () => globalSettingsService.getAll(filters),
  });
}

export function useGlobalSettingByKeyQuery(
  key: string,
  enabled: boolean = true,
): UseQueryResult<GlobalSetting> {
  return useQuery({
    queryKey: QUERY_KEYS.globalSettings.byKey(key),
    queryFn: () => globalSettingsService.getByKey(key),
    enabled: enabled && !!key,
  });
}