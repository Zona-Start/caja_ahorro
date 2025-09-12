import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAccountPayableByIdAction,
  getAccountsPayableAction,
} from '../actions/account-payable-actions';

//hook consutlar datos de las cuentas por pagar
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
