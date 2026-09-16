export interface SalesListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  customerId?: string;
}

export const salesKeys = {
  all: ['sales'] as const,
  customers: {
    all: () => [...salesKeys.all, 'customers'] as const,
    lists: () => [...salesKeys.customers.all(), 'list'] as const,
    list: (filters: SalesListFilters) =>
      [...salesKeys.customers.lists(), filters] as const,
    active: () => [...salesKeys.customers.all(), 'active'] as const,
  },
  posProducts: {
    list: (filters: SalesListFilters) =>
      [...salesKeys.all, 'pos-products', filters] as const,
  },
  invoices: {
    lists: () => [...salesKeys.all, 'invoices', 'list'] as const,
    list: (filters: SalesListFilters) =>
      [...salesKeys.invoices.lists(), filters] as const,
    detail: (id: string) => [...salesKeys.all, 'invoices', 'detail', id] as const,
  },
  receivables: {
    lists: () => [...salesKeys.all, 'receivables', 'list'] as const,
    list: (filters: SalesListFilters) =>
      [...salesKeys.receivables.lists(), filters] as const,
  },
  payments: {
    lists: () => [...salesKeys.all, 'payments', 'list'] as const,
    list: (filters: SalesListFilters) =>
      [...salesKeys.payments.lists(), filters] as const,
  },
  deliveryNotes: {
    lists: () => [...salesKeys.all, 'delivery-notes', 'list'] as const,
    list: (filters: SalesListFilters) =>
      [...salesKeys.deliveryNotes.lists(), filters] as const,
    detail: (id: string) =>
      [...salesKeys.all, 'delivery-notes', 'detail', id] as const,
  },
};
