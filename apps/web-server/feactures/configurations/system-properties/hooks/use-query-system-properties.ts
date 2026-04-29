import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getSettingSytemAction } from '../actions/system-properties-actions';

// Hook for paginated setting sytem data
export function useSettingsSystemGet(params = {}) {
  return useSafeQuery(queryKeys.systemProperties.list(params), () =>
    getSettingSytemAction(params),
  );
}
