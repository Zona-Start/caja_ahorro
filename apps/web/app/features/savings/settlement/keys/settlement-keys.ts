export const settlementKeys = {
  all: ['settlements'] as const,
  lists: () => [...settlementKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...settlementKeys.lists(), filters] as const,
  details: () => [...settlementKeys.all, 'detail'] as const,
  detail: (id: string) => [...settlementKeys.details(), id] as const,
  byCedula: (cedula: string) => [...settlementKeys.all, 'byCedula', cedula] as const,
};
