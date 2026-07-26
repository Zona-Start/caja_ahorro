export const SUPPLIER_PAYMENTS_KEYS = {
  all: ['supplier-payments'] as const,
  lists: () => ['supplier-payments', 'list'] as const,
  list: (filters: object) => ['supplier-payments', 'list', filters] as const,
  details: () => ['supplier-payments', 'detail'] as const,
  detail: (id: string) => ['supplier-payments', 'detail', id] as const,
  pending: () => ['supplier-payments', 'pending'] as const,
  history: (id: string | number) => ['supplier-payments', 'history', id] as const,
};
