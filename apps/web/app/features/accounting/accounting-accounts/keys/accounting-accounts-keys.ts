export const accountingAccountsKeys = {
  all: ['accounting-accounts'] as const,
  lists: () => [...accountingAccountsKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...accountingAccountsKeys.lists(), filters] as const,
  details: () => [...accountingAccountsKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingAccountsKeys.details(), id] as const,
};
