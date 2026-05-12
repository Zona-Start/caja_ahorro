export const SUPPLIER_PAYMENTS_KEYS = {
  all: ['supplier-payments'] as const,
  lists: () => [...SUPPLIER_PAYMENTS_KEYS.all, 'list'] as const,
  list: (filters: object) => [...SUPPLIER_PAYMENTS_KEYS.lists(), filters] as const,
  details: () => [...SUPPLIER_PAYMENTS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...SUPPLIER_PAYMENTS_KEYS.details(), id] as const,
  pending: () => [...SUPPLIER_PAYMENTS_KEYS.all, 'pending'] as const,
  history: (id: number) => [...SUPPLIER_PAYMENTS_KEYS.all, 'history', id] as const,
};
