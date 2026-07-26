export const bankReconciliationKeys = {
  all: ['bank-reconciliations'] as const,
  lists: () => [...bankReconciliationKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...bankReconciliationKeys.lists(), filters] as const,
  details: () => [...bankReconciliationKeys.all, 'detail'] as const,
  detail: (id: string) => [...bankReconciliationKeys.details(), id] as const,
  transactions: (reconId: string) =>
    [...bankReconciliationKeys.detail(reconId), 'available-transactions'] as const,
};
