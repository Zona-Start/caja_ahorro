export const loansManagementKeys = {
  all: ['loansManagement'] as const,
  lists: () => [...loansManagementKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...loansManagementKeys.lists(), filters] as const,
  details: () => [...loansManagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...loansManagementKeys.details(), id] as const,
  byCedula: (cedula: string) =>
    [...loansManagementKeys.all, 'byCedula', cedula] as const,
  count: () => [...loansManagementKeys.all, 'count'] as const,
  searchAssociate: (cedula: string) =>
    [...loansManagementKeys.all, 'searchAssociate', cedula] as const,
};
