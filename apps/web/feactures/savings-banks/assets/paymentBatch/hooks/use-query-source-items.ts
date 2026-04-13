import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getApprovedLiquidationsAction,
  getApprovedWithdrawalsAction,
} from '../actions/payment-batch-actions';

export function useApprovedWithdrawals(): any {
  return useInfiniteQuery({
    queryKey: queryKeys.paymentBatchSources.approvedWithdrawals(),
    queryFn: ({ pageParam = 1 }) =>
      getApprovedWithdrawalsAction(pageParam as number),
    getNextPageParam: (lastPage) => lastPage?.meta?.nextPage || undefined,
    initialPageParam: 1,
  });
}

export function useApprovedLiquidations(): any {
  return useInfiniteQuery({
    queryKey: queryKeys.paymentBatchSources.approvedLiquidations(),
    queryFn: ({ pageParam = 1 }) =>
      getApprovedLiquidationsAction(pageParam as number),
    getNextPageParam: (lastPage) => lastPage?.meta?.nextPage || undefined,
    initialPageParam: 1,
  });
}
