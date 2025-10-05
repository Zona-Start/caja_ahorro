import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getSupplierTransactionsAdvanceAction,
  getSupplierTransactionsNoteCredit,
  getSupplierTransactionsNoteDebit,
} from '../actions/manager-documents-action';

export function useSupplierTransactionsAdvance() {
  return useSafeQuery(queryKeys.supplierTransactions.advances(), () =>
    getSupplierTransactionsAdvanceAction(),
  );
}

export function useSupplierTransactionsNoteCredit() {
  return useSafeQuery(queryKeys.supplierTransactions.noteCredit(), () =>
    getSupplierTransactionsNoteCredit(),
  );
}

export function useSupplierTransactionsNoteDebit() {
  return useSafeQuery(queryKeys.supplierTransactions.noteDebit(), () =>
    getSupplierTransactionsNoteDebit(),
  );
}
