export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  lists: () => [...withdrawalKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...withdrawalKeys.lists(), filters] as const,
  details: () => [...withdrawalKeys.all, 'detail'] as const,
  detail: (id: string) => [...withdrawalKeys.details(), id] as const,
  types: () => [...withdrawalKeys.all, 'types'] as const,
};
