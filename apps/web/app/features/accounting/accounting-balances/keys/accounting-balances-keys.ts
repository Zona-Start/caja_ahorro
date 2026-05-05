export const accountingBalancesKeys = {
  all: ['accounting-balances'] as const,
  lists: () => [...accountingBalancesKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...accountingBalancesKeys.lists(), filters] as const,
  details: () => [...accountingBalancesKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingBalancesKeys.details(), id] as const,
};
