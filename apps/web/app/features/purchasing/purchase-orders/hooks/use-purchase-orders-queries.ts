import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { purchaseOrdersKeys } from '../keys';
import { PurchaseOrdersApi, type PurchaseOrderFilterParams } from '../services/purchase-orders-api';
import type { PurchaseOrderApi } from '../schemas/purchase-orders-api.schema';

export function usePurchaseOrdersQuery(params: PurchaseOrderFilterParams) {
  return useQuery({
    queryKey: purchaseOrdersKeys.list(params),
    queryFn: () => PurchaseOrdersApi.list(params),
  });
}

export function usePurchaseOrderQuery(id: string) {
  return useQuery<PurchaseOrderApi>({
    queryKey: purchaseOrdersKeys.detail(id),
    queryFn: () => PurchaseOrdersApi.getById(id),
    enabled: !!id,
  });
}

export function useProductsForOrder() {
  return useQuery<{ id: string; name: string; sku: string }[]>({
    queryKey: [...purchaseOrdersKeys.all, 'products-list'] as const,
    queryFn: async () => {
      const res = await apiClient.get('/inventory/products/all');
      return (res.data?.data ?? res.data ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useServicesForOrder() {
  return useQuery<{ id: string; name: string; internalCode: string }[]>({
    queryKey: [...purchaseOrdersKeys.all, 'services-list'] as const,
    queryFn: async () => {
      const res = await apiClient.get('/inventory/services/all');
      return (res.data?.data ?? res.data ?? []).filter((s: any) => s.status === 'ACTIVE');
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuppliersForOrder() {
  return useQuery<{ id: string; name: string; taxId: string }[]>({
    queryKey: [...purchaseOrdersKeys.all, 'suppliers-list'] as const,
    queryFn: async () => {
      const res = await apiClient.get('/purchasing/suppliers/all');
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list.filter((s: any) => s.status === 'ACTIVE') : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePurchaseOrderDefaults() {
  return useQuery({
    queryKey: [...purchaseOrdersKeys.all, 'defaults'] as const,
    queryFn: () => PurchaseOrdersApi.getDefaults(),
    staleTime: 5 * 60 * 1000,
  });
}
