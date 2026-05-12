export const SUPPLIER_INVOICES_KEYS = {
  all: ['supplier-invoices'] as const,
  lists: () => [...SUPPLIER_INVOICES_KEYS.all, 'list'] as const,
  list: (filters: object) => [...SUPPLIER_INVOICES_KEYS.lists(), filters] as const,
  details: () => [...SUPPLIER_INVOICES_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...SUPPLIER_INVOICES_KEYS.details(), id] as const,
};
