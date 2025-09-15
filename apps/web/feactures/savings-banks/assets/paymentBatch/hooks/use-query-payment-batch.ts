import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPaymentBatchesAction,
  getPaymentBatchDetailsAction,
} from '../actions/payment-batch-actions';
import { FilterPaymentBatch } from '../schemas/payment-batch.schema';

export function useQueryPaymentBatches(params: FilterPaymentBatch) {
  return useSafeQuery(['payment-batches', params], () =>
    getPaymentBatchesAction(params),
  );
}

export function useQueryPaymentBatchDetails(id: number) {
  return useSafeQuery(['payment-batch-details', id], () =>
    getPaymentBatchDetailsAction(id),
  );
}
