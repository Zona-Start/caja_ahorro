import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getFixedAsset,
  getFixedAssetAll,
} from '../actions/fixed-asset-actions';

export function useFixedAsset(params = {}) {
  return useSafeQuery(['fixed-asset', params], () => getFixedAsset(params));
}

export function useFixedAssetAll() {
  return useSafeQuery(['fixed-asset-all'], () => getFixedAssetAll());
}
