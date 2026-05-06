export const USERS_KEYS = {
  all: ['users'] as const,
  lists: () => [...USERS_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [
    ...USERS_KEYS.lists(),
    filters,
  ] as const,
  details: () => [...USERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USERS_KEYS.details(), id] as const,
};