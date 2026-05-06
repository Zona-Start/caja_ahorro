import type { ModuleSettingsFilters } from '../services/module-settings-service';

export const MODULE_SETTINGS_KEYS = {
  all: ['module-settings'] as const,
  lists: () => [...MODULE_SETTINGS_KEYS.all, 'list'] as const,
  list: (filters?: ModuleSettingsFilters) => [...MODULE_SETTINGS_KEYS.lists(), filters] as const,
  details: () => [...MODULE_SETTINGS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MODULE_SETTINGS_KEYS.details(), id] as const,
};