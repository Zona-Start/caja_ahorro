export const SUPPLIERS_KEYS = {
  all: ['suppliers'] as const,
  lists: () => [...SUPPLIERS_KEYS.all, 'list'] as const,
  list: (filters: object) =>
    [...SUPPLIERS_KEYS.lists(), filters] as const,
  details: () => [...SUPPLIERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUPPLIERS_KEYS.details(), id] as const,
};
