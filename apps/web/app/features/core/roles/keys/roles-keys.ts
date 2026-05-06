export const ROLES_KEYS = {
  all: ['roles'] as const,
  lists: () => [...ROLES_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [
    ...ROLES_KEYS.lists(),
    filters,
  ] as const,
  details: () => [...ROLES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ROLES_KEYS.details(), id] as const,
  permissions: () => [...ROLES_KEYS.all, 'permissions'] as const,
};