export const WITHDRAWAL_TYPES_KEYS = {
  all: ['withdrawalTypes'] as const,
  lists: () => [...WITHDRAWAL_TYPES_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [
    ...WITHDRAWAL_TYPES_KEYS.lists(),
    filters,
  ] as const,
  details: () => [...WITHDRAWAL_TYPES_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...WITHDRAWAL_TYPES_KEYS.details(), id] as const,
};