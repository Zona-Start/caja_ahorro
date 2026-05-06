import type { TenantSettingsFilters } from '../services/tenant-settings-service';

export const TENANT_SETTINGS_KEYS = {
  all: ['tenant-settings'] as const,
  lists: () => [...TENANT_SETTINGS_KEYS.all, 'list'] as const,
  list: (filters?: TenantSettingsFilters) => [...TENANT_SETTINGS_KEYS.lists(), filters] as const,
  details: () => [...TENANT_SETTINGS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TENANT_SETTINGS_KEYS.details(), id] as const,
};