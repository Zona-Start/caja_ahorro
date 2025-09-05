import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInvoicesDraftPendingAction,
  getSupplierInvoiceByIdAction,
  getSupplierInvoicesAction,
  supplierAvailableCreditAction,
} from '../actions/supplier-invoice-actions';

export function useSupplierInvoices(params = {}) {
  return useSafeQuery(['supplier-invoices', params], () =>
    getSupplierInvoicesAction(params),
  );
}

export function useSupplierInvoiceById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['supplier-invoice', id],
    () => getSupplierInvoiceByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}

export function useSupplierInvoicesBySupplier(
  supplierId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['supplier-invoices-by-supplier', supplierId],
    () => getSupplierInvoicesAction({ supplierId, status: 'OPEN' }),
    {
      enabled: supplierId ? options?.enabled : false,
      ...options,
    },
  );
}

export function useSupplierInvoicesDraftPending(enabled?: boolean) {
  return useSafeQuery(
    ['supplier-invoices-draft-pending'],
    () => getInvoicesDraftPendingAction(),
    {
      enabled: enabled ? true : false,
    },
  );
}

export function useSupplierAvailableCredit(
  supplierId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['accounts-payable-advances', supplierId],
    () => supplierAvailableCreditAction(supplierId as number),
    {
      enabled: !!supplierId && (options?.enabled ?? true),
      ...options,
    },
  );
}
