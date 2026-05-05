export const withdrawalTypesKeys = {
  all: ['withdrawal-types'] as const,
  lists: () => [...withdrawalTypesKeys.all, 'list'] as const,
  list: (params: string) => [...withdrawalTypesKeys.lists(), params] as const,
  details: () => [...withdrawalTypesKeys.all, 'detail'] as const,
  detail: (id: number) => [...withdrawalTypesKeys.details(), id] as const,
};
