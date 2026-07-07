import { apiClient } from '@/lib/api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export interface PurchaseOrderOption {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrderDetail {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: { name: string };
  items: PurchaseOrderItem[];
}

export interface SupplierInvoiceOption {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
}

export interface SupplierInvoiceItem {
  id: string;
  itemId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitCost: number;
  totalLine: number;
}

export interface SupplierInvoiceDetail {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplier: { name: string };
  items: SupplierInvoiceItem[];
}

export interface ProductOption {
  id: string;
  internalCode: string;
  name: string;
}

export function usePurchaseOrdersQuery(): UseQueryResult<PurchaseOrderOption[]> {
  return useQuery({
    queryKey: ['purchase-orders', 'options'],
    queryFn: async () => {
      const resp = await apiClient.get('/administration/purchase-orders/paginated?limit=100&status=PENDING');
      return (resp.data?.data ?? []) as PurchaseOrderOption[];
    },
    staleTime: 60 * 1000,
  });
}

export function usePurchaseOrderQuery(
  id: string,
  enabled: boolean,
): UseQueryResult<PurchaseOrderDetail> {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      const resp = await apiClient.get(`/administration/purchase-orders/${id}`);
      return resp.data?.data as PurchaseOrderDetail;
    },
    enabled: enabled && !!id,
  });
}

export function useSupplierInvoicesQuery(): UseQueryResult<SupplierInvoiceOption[]> {
  return useQuery({
    queryKey: ['supplier-invoices', 'options'],
    queryFn: async () => {
      const resp = await apiClient.get('/administration/supplier-invoices/status/draft-pending');
      return (resp.data?.data ?? []) as SupplierInvoiceOption[];
    },
    staleTime: 60 * 1000,
  });
}

export function useSupplierInvoiceQuery(
  id: string,
  enabled: boolean,
): UseQueryResult<SupplierInvoiceDetail> {
  return useQuery({
    queryKey: ['supplier-invoices', id],
    queryFn: async () => {
      const resp = await apiClient.get(`/administration/supplier-invoices/${id}`);
      return resp.data?.data as SupplierInvoiceDetail;
    },
    enabled: enabled && !!id,
  });
}

export function useProductsAllQuery(enabled: boolean): UseQueryResult<ProductOption[]> {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const resp = await apiClient.get('/inventory/products/all');
      const data = resp.data;
      if (Array.isArray(data)) return data as ProductOption[];
      if (data?.data && Array.isArray(data.data)) return data.data as ProductOption[];
      return [] as ProductOption[];
    },
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useProductPriceQuery(
  productId: string,
  enabled: boolean,
): UseQueryResult<{ baseCost: number }> {
  return useQuery({
    queryKey: ['product', productId, 'price'],
    queryFn: async () => {
      const resp = await apiClient.get(`/inventory/products/${productId}`);
      const product = resp.data?.data ?? resp.data ?? {};
      const dataProductPrices = product.dataProductPrices;
      const baseCost = Array.isArray(dataProductPrices) && dataProductPrices.length > 0
        ? Number(dataProductPrices[0].baseCost ?? 0)
        : 0;
      return { baseCost };
    },
    enabled: enabled && !!productId,
    staleTime: 60 * 1000,
  });
}
