export const bankDirectoryKeys = {
  all: ['bank-directory'] as const,
  lists: () => [...bankDirectoryKeys.all, 'list'] as const,
  list: (filters: object) => [...bankDirectoryKeys.lists(), filters] as const,
  details: () => [...bankDirectoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...bankDirectoryKeys.details(), id] as const,
};
