export const CATEGORIES_KEYS = {
  all: ['inventory-categories'] as const,
  lists: () => [...CATEGORIES_KEYS.all, 'list'] as const,
  list: (filters: object) => [...CATEGORIES_KEYS.lists(), filters] as const,
  details: () => [...CATEGORIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORIES_KEYS.details(), id] as const,
  byGroup: () => [...CATEGORIES_KEYS.all, 'byGroup'] as const,
  group: (group: string) => [...CATEGORIES_KEYS.byGroup(), group] as const,
};
