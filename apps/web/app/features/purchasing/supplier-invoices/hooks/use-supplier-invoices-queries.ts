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
  id: z.string(),
  name: z.string(),
});

export function useSuppliersAllQuery(enabled = true) {
  return useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/purchasing/suppliers/all');
      const raw = response.data?.data ?? response.data ?? [];
      return supplierSelectSchema.array().parse(raw);
    },
    enabled,
  });
}

const purchaseOrderSelectSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
});

export function usePurchaseOrdersForInvoiceQuery(
  supplierId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['purchase-orders', 'for-invoice', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const response = await apiClient.get(
        `/administration/purchase-orders/for-invoice?supplierId=${supplierId}`,
      );
      const raw = response.data?.data ?? response.data ?? [];
      return purchaseOrderSelectSchema.array().parse(raw);
    },
    enabled: enabled && !!supplierId,
  });
}

const productSelectSchema = z.object({
  id: z.string(),
  name: z.string(),
  unitOfMeasure: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
});

export function useProductsAllQuery(enabled = true) {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/inventory/products/all');
        const data = response.data?.data ?? response.data ?? [];
        return productSelectSchema.array().parse(data);
      } catch {
        return [];
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

const serviceSelectSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export function useServicesAllQuery(enabled = true) {
  return useQuery({
    queryKey: ['services', 'all'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/inventory/services/all');
        const data = response.data?.data ?? response.data ?? [];
        return serviceSelectSchema.array().parse(data);
      } catch {
        return [];
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

const accountsPayableBySupplierSchema = z.object({
  id: z.string(),
  accountsPayableNumber: z.string(),
  supplierName: z.string().optional(),
  remainingAmount: z.number().optional(),
});

export function useAccountsPayableBySupplierQuery(
  supplierId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['accounts-payable', 'by-supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const response = await apiClient.get(
        `/administration/accounts-payable/paginated?supplierId=${supplierId}&limit=200`,
      );
      try {
        const data = response.data?.data ?? response.data ?? [];
        return z.array(accountsPayableBySupplierSchema).parse(data);
      } catch {
        return [];
      }
    },
    enabled: enabled && !!supplierId,
  });
}
