export const loansManagementKeys = {
  all: ['loansManagement'] as const,
  lists: () => [...loansManagementKeys.all, 'list'] as const,
  list: (params: string) => [...loansManagementKeys.lists(), params] as const,
  details: () => [...loansManagementKeys.all, 'detail'] as const,
  detail: (id: number) => [...loansManagementKeys.details(), id] as const,
  byCedula: (cedula: string) => [...loansManagementKeys.all, 'byCedula', cedula] as const,
};