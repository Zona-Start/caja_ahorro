export const individualLoadKeys = {
  all: ['individualLoad'] as const,
  lists: () => [...individualLoadKeys.all, 'list'] as const,
  list: (params: string) => [...individualLoadKeys.lists(), params] as const,
  details: () => [...individualLoadKeys.all, 'detail'] as const,
  detail: (id: string) => [...individualLoadKeys.details(), id] as const,
  byCedula: (cedula: string) => [...individualLoadKeys.all, 'byCedula', cedula] as const,
};