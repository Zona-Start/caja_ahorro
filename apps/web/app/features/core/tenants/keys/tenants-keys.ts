export const TENANTS_KEYS = {
  all: ['tenants'] as const,
  lists: () => [...TENANTS_KEYS.all, 'list'] as const,
  list: (filters: object) => [
    ...TENANTS_KEYS.lists(),
    filters,
  ] as const,
  details: () => [...TENANTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TENANTS_KEYS.details(), id] as const,
  byRif: (rif: string) => [...TENANTS_KEYS.all, 'byRif', rif] as const,
  count: () => [...TENANTS_KEYS.all, 'count'] as const,
};