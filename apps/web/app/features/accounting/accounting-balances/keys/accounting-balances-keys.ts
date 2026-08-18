export const accountingBalancesKeys = {
  all: ['accounting-balances'] as const,
  lists: () => [...accountingBalancesKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...accountingBalancesKeys.lists(), filters] as const,
  details: () => [...accountingBalancesKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingBalancesKeys.details(), id] as const,
  hasInitialLoad: () => [...accountingBalancesKeys.all, 'has-initial-load'] as const,
};
