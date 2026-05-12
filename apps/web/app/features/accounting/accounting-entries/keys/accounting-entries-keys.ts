export const accountingEntriesKeys = {
  all: ['accounting-entries'] as const,
  lists: () => [...accountingEntriesKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...accountingEntriesKeys.lists(), filters] as const,
  details: () => [...accountingEntriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingEntriesKeys.details(), id] as const,
};
