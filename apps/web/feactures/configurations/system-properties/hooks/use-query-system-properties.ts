import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSettingSytemAction } from '../actions/system-properties-actions';

// Hook for paginated setting sytem data
export function useSettingsSystemGet(params = {}, group: string) {
  return useSafeQuery(['setting-system', group], () =>
    getSettingSytemAction(params, group),
  );
}
