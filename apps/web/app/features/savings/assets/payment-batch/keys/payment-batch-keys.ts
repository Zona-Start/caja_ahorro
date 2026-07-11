export const paymentBatchKeys = {
  all: ['paymentBatches'] as const,
  lists: () => [...paymentBatchKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...paymentBatchKeys.lists(), params] as const,
  details: () => [...paymentBatchKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentBatchKeys.details(), id] as const,
  approved: {
    loans: () => [...paymentBatchKeys.all, 'approved', 'loans'] as const,
    withdrawals: (params: Record<string, unknown>) => [...paymentBatchKeys.all, 'approved', 'withdrawals', params] as const,
    liquidations: (params: Record<string, unknown>) => [...paymentBatchKeys.all, 'approved', 'liquidations', params] as const,
  },
};
