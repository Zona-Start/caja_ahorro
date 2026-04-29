import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getPaymentBatchesAction,
  getPaymentBatchDetailsAction,
} from '../actions/payment-batch-actions';
import { FilterPaymentBatch } from '../schemas/payment-batch.schema';

export function useQueryPaymentBatches(params: FilterPaymentBatch) {
  return useSafeQuery(queryKeys.paymentBatches.list(params), () =>
    getPaymentBatchesAction(params),
  );
}

export function useQueryPaymentBatchDetails(id: number, enabled?: boolean) {
  return useSafeQuery(
    queryKeys.paymentBatches.detail(id),
    () => getPaymentBatchDetailsAction(id),
    { enabled },
  );
}
