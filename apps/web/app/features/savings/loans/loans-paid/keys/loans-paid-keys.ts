export const loansPaidKeys = {
  all: ['loansPaid'] as const,
  lists: () => [...loansPaidKeys.all, 'list'] as const,
  list: (params: string) => [...loansPaidKeys.lists(), params] as const,
  details: () => [...loansPaidKeys.all, 'detail'] as const,
  detail: (id: number) => [...loansPaidKeys.details(), id] as const,
};