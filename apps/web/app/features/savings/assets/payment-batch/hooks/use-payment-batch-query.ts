import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { paymentBatchService } from '../services/payment-batch-service';
import { paymentBatchKeys } from '../keys/payment-batch-keys';

export function useQueryPaymentBatches(filters: {
  page?: number;
  limit?: number;
  status?: string | null;
  search?: string | null;
}) {
  return useQuery({
    queryKey: paymentBatchKeys.list(filters as Record<string, unknown>),
    queryFn: () => paymentBatchService.getPaymentBatches(filters),
  });
}

export function useQueryPaymentBatchDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: paymentBatchKeys.detail(id),
    queryFn: () => paymentBatchService.getPaymentBatchDetails(id),
    enabled: options?.enabled ?? true,
  });
}

export function useApprovedLoans() {
  return useQuery({
    queryKey: paymentBatchKeys.approved.loans(),
    queryFn: async () => {
      const result = await paymentBatchService.getApprovedLoans();
      return result;
    },
    staleTime: 30_000,
  });
}

export function useApprovedWithdrawals() {
  return useInfiniteQuery({
    queryKey: paymentBatchKeys.approved.withdrawals({}),
    queryFn: ({ pageParam = 1 }) =>
      paymentBatchService.getApprovedWithdrawals(pageParam as number, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined;
    },
    staleTime: 30_000,
  });
}

export function useApprovedLiquidations() {
  return useInfiniteQuery({
    queryKey: paymentBatchKeys.approved.liquidations({}),
    queryFn: ({ pageParam = 1 }) =>
      paymentBatchService.getApprovedLiquidations(pageParam as number, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined;
    },
    staleTime: 30_000,
  });
}
