export const specialOperationsKeys = {
  all: ['savings', 'special-operations'] as const,
  lists: () => [...specialOperationsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...specialOperationsKeys.lists(), filters] as const,
  details: () => [...specialOperationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...specialOperationsKeys.details(), id] as const,
  config: (operationType: string) =>
    [...specialOperationsKeys.all, 'config', operationType] as const,
  accounts: () => ['account-plan', 'all'] as const,
};
