import { useSafeQuery } from '@/hooks/use-safe-query';
import { getPaginatedAccountingEntriesAction } from '../actions/accounting-entry-actions';

export function usePaginatedAccountingEntries(params = {}) {
  return useSafeQuery(['paginated_accounting_entries', params], () =>
    getPaginatedAccountingEntriesAction(params),
  );
}
