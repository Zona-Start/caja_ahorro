import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getLoanDisbursementBatchesAction,
  getLoanDisbursementBatchDetailsAction,
} from '../actions/loan-disbursement-batch-actions';
import { FilterLoanDisbursementBatch } from '../schemas/loan-disbursement-batch.schema';

export function useQueryLoanDisbursementBatches(params: FilterLoanDisbursementBatch) {
  return useSafeQuery(queryKeys.loanDisbursementBatches.list(params), () =>
    getLoanDisbursementBatchesAction(params),
  );
}

export function useQueryLoanDisbursementBatchDetails(id: number, enabled?: boolean) {
  return useSafeQuery(
    queryKeys.loanDisbursementBatches.detail(id),
    () => getLoanDisbursementBatchDetailsAction(id),
    { enabled },
  );
}
