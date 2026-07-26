import { useQuery } from '@tanstack/react-query';
import type { SupplierPaymentsFilters } from './use-supplier-payments-filters';
import type { PendingPaymentsFilters } from './use-pending-payments-filters';
import { supplierPaymentsService } from '../services/supplier-payments-service';

const mapFiltersToHistoryParams = (filters: SupplierPaymentsFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  status: filters.status || undefined,
  startDate: filters.startDate,
  endDate: filters.endDate,
  supplierIds: filters.supplierIds,
  sortBy: filters.sortBy,
  sortOrder: filters.sortOrder,
});

const mapFiltersToPendingParams = (filters: PendingPaymentsFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  supplierId: filters.supplierId || undefined,
  status: filters.status || undefined,
});

export function usePaymentHistoryQuery(
  filters: SupplierPaymentsFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: ['supplier-payments', 'history', filters] as const,
    queryFn: () => supplierPaymentsService.getHistory(mapFiltersToHistoryParams(filters)),
    enabled,
  });
}

export function usePendingPaymentsQuery(
  filters: PendingPaymentsFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: ['supplier-payments', 'pending', filters] as const,
    queryFn: () => supplierPaymentsService.getPending(mapFiltersToPendingParams(filters)),
    enabled,
  });
}

export function useAvailableCreditsQuery(
  supplierId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['supplier-payments', 'available-credits', supplierId] as const,
    queryFn: () => supplierPaymentsService.getAvailableCredits(supplierId!),
    enabled: enabled && !!supplierId,
  });
}

export function useAllCreditsQuery(enabled = true) {
  return useQuery({
    queryKey: ['supplier-payments', 'all-credits'] as const,
    queryFn: () => supplierPaymentsService.getAllCredits(),
    enabled,
  });
}
