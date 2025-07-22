import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAccountsPayableAction,
  getAccountPayableByIdAction,
} from '../actions/account-payable-actions';

export function useAccountsPayable(params = {}) {
  return useSafeQuery(['accounts-payable', params], () =>
    getAccountsPayableAction(params),
  );
}

export function useAccountPayableById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['account-payable', id],
    () => getAccountPayableByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}

export function useAccountPayableBySupplier(
  supplierInvoiceId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['accounts-payable-by-supplier', supplierInvoiceId],
    () => getAccountsPayableAction({ supplierInvoiceId, status: 'PENDING' }),
    {
      enabled: supplierInvoiceId ? options?.enabled : false,
      ...options,
    },
  );
}
