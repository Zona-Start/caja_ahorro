export const accountsPayableKeys = {
  all: ['accounts-payable'] as const,
  lists: () => [...accountsPayableKeys.all, 'list'] as const,
  list: (filters: object) => [...accountsPayableKeys.lists(), filters] as const,
  details: () => [...accountsPayableKeys.all, 'detail'] as const,
  detail: (id: number) => [...accountsPayableKeys.details(), id] as const,
  appliedTransactions: (id: number) =>
    [...accountsPayableKeys.all, 'applied-transactions', id] as const,
};
