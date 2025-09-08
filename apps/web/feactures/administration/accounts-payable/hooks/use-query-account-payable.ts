import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAccountPayableByIdAction,
  getAccountsPayableAction,
  getAccountsPayableBySuppliersAction, // Import the new action
  getPreloadedPaymentAction,
} from '../actions/account-payable-actions';

export function useAccountsPayableBySuppliers(
  params: { supplierIds?: number[] } = {}, // <-- Cambiado de string a number[]
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['accounts-payable-by-suppliers', params],
    () => getAccountsPayableBySuppliersAction(params),
    {
      // La validación ahora comprueba si el array no está vacío
      enabled: !!params.supplierIds?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}

export function useGetPreloadedPayment(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['preloaded-payment', id],
    () => getPreloadedPaymentAction(id),
    {
      enabled: !!id && (options?.enabled ?? false),
    },
  );
}

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

// export function useAccountPayableReport(
//   id: number,
//   options?: { enabled?: boolean },
// ) {
//   return useSafeQuery(
//     ['account-payable-report', id],
//     () => getAccountPayableReportAction(id),
//     {
//       enabled: id ? options?.enabled : false,
//       ...options,
//     },
//   );
// }
