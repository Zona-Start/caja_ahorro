export const CATEGORIES_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORIES_KEYS.all, 'list'] as const,
  list: (filters: object) => [
    ...CATEGORIES_KEYS.lists(),
    filters,
  ] as const,
  details: () => [...CATEGORIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORIES_KEYS.details(), id] as const,
  byType: (type: string) => [...CATEGORIES_KEYS.all, 'byType', type] as const,
};