import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { salesKeys } from '../keys/sales-keys';
import type {
  Customer,
  DeliveryNote,
  PaginatedResult,
  PosProduct,
  Receivable,
  SaleInvoice,
} from '../schemas/sales.schema';
import {
  salesService,
  type PosProductQuery,
} from '../services/sales-service';

interface PaginatedParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  customerId?: string;
}

export function useCustomersPaginated(
  params: PaginatedParams,
): UseQueryResult<PaginatedResult<Customer>> {
  return useQuery({
    queryKey: salesKeys.customers.list(params),
    queryFn: () => salesService.getCustomersPaginated(params),
  });
}

export function useCustomersAll(): UseQueryResult<Customer[]> {
  return useQuery({
    queryKey: salesKeys.customers.active(),
    queryFn: () => salesService.getCustomersAll(),
  });
}

export function usePosProducts(
  params: PosProductQuery,
): UseQueryResult<PaginatedResult<PosProduct>> {
  const filters = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search,
  };
  return useQuery({
    queryKey: salesKeys.posProducts.list(filters),
    queryFn: () => salesService.getPosProducts(params),
  });
}

export function useInvoicesPaginated(
  params: PaginatedParams,
): UseQueryResult<PaginatedResult<SaleInvoice>> {
  return useQuery({
    queryKey: salesKeys.invoices.list(params),
    queryFn: () => salesService.getInvoicesPaginated(params),
  });
}

export function useInvoice(id: string): UseQueryResult<SaleInvoice> {
  return useQuery({
    queryKey: salesKeys.invoices.detail(id),
    queryFn: () => salesService.getInvoiceById(id),
    enabled: !!id,
  });
}

export function useReceivables(
  params: PaginatedParams,
): UseQueryResult<PaginatedResult<Receivable>> {
  return useQuery({
    queryKey: salesKeys.receivables.list(params),
    queryFn: () => salesService.getReceivables(params),
  });
}

export function useDeliveryNotes(
  params: PaginatedParams,
): UseQueryResult<PaginatedResult<DeliveryNote>> {
  return useQuery({
    queryKey: salesKeys.deliveryNotes.list(params),
    queryFn: () => salesService.getDeliveryNotesPaginated(params),
  });
}

export function useDeliveryNoteDetail(
  id: string,
): UseQueryResult<DeliveryNote> {
  return useQuery({
    queryKey: salesKeys.deliveryNotes.detail(id),
    queryFn: () => salesService.getDeliveryNoteById(id),
    enabled: !!id,
  });
}
