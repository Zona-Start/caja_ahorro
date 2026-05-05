import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { paymentBatchService } from '../services/payment-batch-service';

export function useQueryPaymentBatches(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: unknown[]; meta: unknown }, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.paymentBatches.list(JSON.stringify(params)),
    queryFn: () => paymentBatchService.getPaymentBatches(params),
  });
}

export function useQueryPaymentBatchDetails(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.paymentBatches.detail(id),
    queryFn: () => paymentBatchService.getPaymentBatchDetails(id),
    enabled: options?.enabled ?? !!id,
  });
}