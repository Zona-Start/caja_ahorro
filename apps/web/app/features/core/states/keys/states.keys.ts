export const statesKeys = {
  all: ['states'] as const,
  lists: () => [...statesKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...statesKeys.lists(), filters] as const,
  details: () => [...statesKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...statesKeys.details(), id] as const,
};
