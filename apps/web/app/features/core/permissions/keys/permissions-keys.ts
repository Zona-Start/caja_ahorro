import type { PermissionsFilters } from '../hooks/use-permissions-filters';

export const PERMISSIONS_KEYS = {
  all: ['permissions'] as const,
  lists: () => [...PERMISSIONS_KEYS.all, 'list'] as const,
  list: (filters?: PermissionsFilters) => [...PERMISSIONS_KEYS.lists(), filters] as const,
  details: () => [...PERMISSIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PERMISSIONS_KEYS.details(), id] as const,
};