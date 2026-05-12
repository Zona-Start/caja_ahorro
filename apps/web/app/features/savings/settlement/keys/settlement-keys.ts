export const settlementKeys = {
  all: ['settlements'] as const,
  lists: () => [...settlementKeys.all, 'list'] as const,
  list: (params: string) => [...settlementKeys.lists(), params] as const,
  details: () => [...settlementKeys.all, 'detail'] as const,
  detail: (id: number) => [...settlementKeys.details(), id] as const,
  byCedula: (cedula: string) => [...settlementKeys.all, 'byCedula', cedula] as const,
};