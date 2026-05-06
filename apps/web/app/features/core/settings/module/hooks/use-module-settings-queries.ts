import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { moduleSettingsService, type PaginatedResponse } from '../services/module-settings-service';
import type { ModuleSetting } from '../schemas/module-settings.schema';
import type { ModuleSettingsFilters } from './use-module-settings-filters';

export function useModuleSettingsQuery(
  filters?: ModuleSettingsFilters,
): UseQueryResult<PaginatedResponse<ModuleSetting>> {
  return useQuery({
    queryKey: QUERY_KEYS.moduleSettings.list(filters),
    queryFn: () => moduleSettingsService.getAll(filters),
  });
}