export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  lists: () => [...withdrawalKeys.all, 'list'] as const,
  list: (params: string) => [...withdrawalKeys.lists(), params] as const,
  details: () => [...withdrawalKeys.all, 'detail'] as const,
  detail: (id: number) => [...withdrawalKeys.details(), id] as const,
  types: () => [...withdrawalKeys.all, 'types'] as const,
};
