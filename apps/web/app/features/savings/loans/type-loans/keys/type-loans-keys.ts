export const typeLoansKeys = {
  all: ['typeLoans'] as const,
  lists: () => [...typeLoansKeys.all, 'list'] as const,
  list: (params: string) => [...typeLoansKeys.lists(), params] as const,
  details: () => [...typeLoansKeys.all, 'detail'] as const,
  detail: (id: number) => [...typeLoansKeys.details(), id] as const,
};