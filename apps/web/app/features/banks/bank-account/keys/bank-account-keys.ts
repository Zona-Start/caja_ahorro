export const bankAccountKeys = {
  all: ['bank-accounts'] as const,
  lists: () => [...bankAccountKeys.all, 'list'] as const,
  list: (filters: object) => [...bankAccountKeys.lists(), filters] as const,
  details: () => [...bankAccountKeys.all, 'detail'] as const,
  detail: (id: number) => [...bankAccountKeys.details(), id] as const,
};
