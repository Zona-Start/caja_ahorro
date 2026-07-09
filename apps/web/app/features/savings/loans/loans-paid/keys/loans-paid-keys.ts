export const loansPaidKeys = {
  all: ['loansPaid'] as const,
  lists: () => [...loansPaidKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...loansPaidKeys.lists(), params] as const,
  details: () => [...loansPaidKeys.all, 'detail'] as const,
  detail: (id: string) => [...loansPaidKeys.details(), id] as const,
  byCedula: (cedula: string) =>
    [...loansPaidKeys.all, 'byCedula', cedula] as const,
};
