export const creditManagementKeys = {
  all: ['creditManagements'] as const,
  lists: () => [...creditManagementKeys.all, 'list'] as const,
  list: (params: string) => [...creditManagementKeys.lists(), params] as const,
  details: () => [...creditManagementKeys.all, 'detail'] as const,
  detail: (id: number) => [...creditManagementKeys.details(), id] as const,
  byCedula: (cedula: string) => [...creditManagementKeys.all, 'byCedula', cedula] as const,
  count: () => [...creditManagementKeys.all, 'count'] as const,
};