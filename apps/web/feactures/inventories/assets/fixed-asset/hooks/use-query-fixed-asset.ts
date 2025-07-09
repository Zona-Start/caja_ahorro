import { useSafeQuery } from '@/hooks/use-safe-query';
import { getFixedAsset } from '../actions/fixed-asset-actions';

export function useFixedAsset(params = {}) {
  return useSafeQuery(['fixed-asset', params], () => getFixedAsset(params));
}
