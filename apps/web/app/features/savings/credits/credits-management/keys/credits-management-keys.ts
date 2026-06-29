export const creditManagementKeys = {
  all: ['creditManagements'] as const,
  lists: () => [...creditManagementKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...creditManagementKeys.lists(), filters] as const,
  details: () => [...creditManagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...creditManagementKeys.details(), id] as const,
  byCedula: (cedula: string) =>
    [...creditManagementKeys.all, 'byCedula', cedula] as const,
  count: () => [...creditManagementKeys.all, 'count'] as const,
  searchAssociate: (cedula: string) =>
    [...creditManagementKeys.all, 'searchAssociate', cedula] as const,
  creditTypes: () => [...creditManagementKeys.all, 'creditTypes'] as const,
  bankAccounts: () => [...creditManagementKeys.all, 'bankAccounts'] as const,
  suppliers: () => [...creditManagementKeys.all, 'suppliers'] as const,
  products: () => [...creditManagementKeys.all, 'products'] as const,
  amortization: (params: Record<string, unknown>) =>
    [...creditManagementKeys.all, 'amortization', params] as const,
};
