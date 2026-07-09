export const creditsPaidKeys = {
  all: ['creditsPaid'] as const,
  lists: () => [...creditsPaidKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...creditsPaidKeys.lists(), params] as const,
  details: () => [...creditsPaidKeys.all, 'detail'] as const,
  detail: (id: string) => [...creditsPaidKeys.details(), id] as const,
  byCedula: (cedula: string) =>
    [...creditsPaidKeys.all, 'byCedula', cedula] as const,
};
