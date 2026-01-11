import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAccountingRulesAction } from '../actions/accounting-rules-actions';

export function useAccountingRules(companyId: number) {
  return useSafeQuery(
    queryKeys.accountingRules.list({ companyId }),
    () => getAccountingRulesAction(companyId),
    { enabled: !!companyId },
  );
}
