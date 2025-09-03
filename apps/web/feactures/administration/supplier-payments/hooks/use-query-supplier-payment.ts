
import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSupplierPaymentByIdAction,
  getSupplierPaymentsAction,
} from '../actions';

export function useSupplierPayments(params = {}) {
  return useSafeQuery(['supplier-payments', params], () =>
    getSupplierPaymentsAction(params)
  );
}

export function useSupplierPaymentById(
  id: number,
  options?: { enabled?: boolean }
) {
  return useSafeQuery(
    ['supplier-payment', id],
    () => getSupplierPaymentByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    }
  );
}
