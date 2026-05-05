export const paymentBatchKeys = {
  all: ['paymentBatches'] as const,
  lists: () => [...paymentBatchKeys.all, 'list'] as const,
  list: (params: string) => [...paymentBatchKeys.lists(), params] as const,
  details: () => [...paymentBatchKeys.all, 'detail'] as const,
  detail: (id: number) => [...paymentBatchKeys.details(), id] as const,
};