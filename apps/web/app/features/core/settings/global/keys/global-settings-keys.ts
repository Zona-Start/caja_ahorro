import type { GlobalSettingsFilters } from '../services/global-settings-service';

export const GLOBAL_SETTINGS_KEYS = {
  all: ['global-settings'] as const,
  lists: () => [...GLOBAL_SETTINGS_KEYS.all, 'list'] as const,
  list: (filters?: GlobalSettingsFilters) => [...GLOBAL_SETTINGS_KEYS.lists(), filters] as const,
  details: () => [...GLOBAL_SETTINGS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...GLOBAL_SETTINGS_KEYS.details(), id] as const,
  byKey: (key: string) => [...GLOBAL_SETTINGS_KEYS.details(), 'key', key] as const,
};