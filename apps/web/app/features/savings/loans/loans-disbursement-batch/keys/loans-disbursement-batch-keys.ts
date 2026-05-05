export const loansDisbursementBatchKeys = {
  all: ['loansDisbursementBatch'] as const,
  lists: () => [...loansDisbursementBatchKeys.all, 'list'] as const,
  list: (params: string) => [...loansDisbursementBatchKeys.lists(), params] as const,
  details: () => [...loansDisbursementBatchKeys.all, 'detail'] as const,
  detail: (id: number) => [...loansDisbursementBatchKeys.details(), id] as const,
};