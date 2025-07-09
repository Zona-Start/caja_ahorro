import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAllFixedAssetCategories,
  getFixedAssetCategories,
} from '../actions/fixed-asset-categories-actions';

export function useFixedAssetCategoriesSchemaAPI(params = {}) {
  return useSafeQuery(['fixed-asset-categories', params], () =>
    getFixedAssetCategories(params),
  );
}

export function useFixedAssetCategoriesSchemaAPIAll() {
  return useSafeQuery(['fixed-asset-categories-all'], () =>
    getAllFixedAssetCategories(),
  );
}
