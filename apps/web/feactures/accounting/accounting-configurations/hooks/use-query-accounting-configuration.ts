import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getPaginatedAccountingConfigurationsAction } from '../actions/accounting-configuration-actions';

export function usePaginatedAccountingConfigurations(params = {}) {
  return useSafeQuery(
    queryKeys.accountingConfigurations.paginated(params),
    () => getPaginatedAccountingConfigurationsAction(params),
    { enabled: Object.keys(params).length > 0 }
  );
}
