import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSettingSytemAction } from '../actions/system-properties-actions';

// Hook for paginated setting sytem data
export function useSettingsSystemGet(params = {}) {
  return useSafeQuery(['setting-system', params], () =>
    getSettingSytemAction(params),
  );
}
