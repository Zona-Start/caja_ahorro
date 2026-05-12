import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';
import type {
  PaginatedPurchaseOrdersResponse,
  PurchaseOrderQueryParams,
} from '../services/purchase-orders-service';
import { purchaseOrdersService } from '../services/purchase-orders-service';
import type { PurchaseOrderForInvoiceApi } from '../schemas/purchase-orders-api.schema';

export function usePurchaseOrdersQuery(params: PurchaseOrderQueryParams) {
  return useQuery<PaginatedPurchaseOrdersResponse>({
    queryKey: QUERY_KEYS.purchaseOrders.list(params),
    queryFn: () => purchaseOrdersService.getPaginated(params),
  });
}

export function usePurchaseOrderQuery(id: number | null) {
  return useQuery<PurchaseOrder>({
    queryKey: QUERY_KEYS.purchaseOrders.detail(id as number),
    queryFn: () => purchaseOrdersService.getById(id as number),
    enabled: id !== null && id > 0,
  });
}

export function usePurchaseOrdersForInvoiceQuery(supplierId: number | null) {
  return useQuery<PurchaseOrderForInvoiceApi[]>({
    queryKey: QUERY_KEYS.purchaseOrders.forInvoice(supplierId as number),
    queryFn: () =>
      purchaseOrdersService.getForInvoice(supplierId as number),
    enabled: supplierId !== null && supplierId > 0,
  });
}
