export const associatesKeys = {
  all: ['associates'] as const,
  lists: () => [...associatesKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...associatesKeys.lists(), filters] as const,
  details: () => [...associatesKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...associatesKeys.details(), id] as const,
};
