import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import type { SupplierPaymentsFilters } from './use-supplier-payments-filters';
import { supplierPaymentsService } from '../services/supplier-payments-service';

const mapFiltersToApiParams = (filters: SupplierPaymentsFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  status: filters.status || undefined,
});

export function useSupplierPaymentsQuery(
  filters: SupplierPaymentsFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.supplierPayments.list(filters),
    queryFn: () => supplierPaymentsService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useSupplierPaymentsPendingQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.supplierPayments.pending(),
    queryFn: () => supplierPaymentsService.getPending(),
    enabled,
  });
}

export function useSupplierPaymentHistoryQuery(
  accountPayableId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.supplierPayments.history(accountPayableId ?? 0),
    queryFn: () => supplierPaymentsService.getHistory(accountPayableId!),
    enabled: enabled && !!accountPayableId,
  });
}
