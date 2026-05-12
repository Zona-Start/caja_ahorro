import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import {
  type SupplierInvoicesFilters,
} from './use-supplier-invoices-filters';
import { supplierInvoicesService } from '../services/supplier-invoices-service';
import type { SupplierInvoiceApi } from '../schemas/supplier-invoice-api.schema';

const mapFiltersToApiParams = (filters: SupplierInvoicesFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  status: filters.status || undefined,
  supplierId: filters.supplierId,
});

export function useSupplierInvoicesQuery(
  filters: SupplierInvoicesFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.supplierInvoices.list(filters),
    queryFn: () => supplierInvoicesService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useSupplierInvoiceQuery(
  id: number,
  enabled = true,
): UseQueryResult<SupplierInvoiceApi> {
  return useQuery({
    queryKey: QUERY_KEYS.supplierInvoices.detail(id),
    queryFn: () => supplierInvoicesService.getById(id),
    enabled: enabled && !!id,
  });
}

const supplierSelectSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export function useSuppliersAllQuery(enabled = true) {
  return useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/administration/suppliers/all');
      return supplierSelectSchema.array().parse(response.data);
    },
    enabled,
  });
}

const purchaseOrderSelectSchema = z.object({
  id: z.number(),
  orderNumber: z.string(),
});

export function usePurchaseOrdersForInvoiceQuery(
  supplierId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['purchase-orders', 'for-invoice', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const response = await apiClient.get(
        `/administration/purchase-orders/for-invoice?supplierId=${supplierId}`,
      );
      return purchaseOrderSelectSchema.array().parse(response.data);
    },
    enabled: enabled && !!supplierId,
  });
}
