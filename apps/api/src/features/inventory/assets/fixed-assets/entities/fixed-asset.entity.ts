import { fixedAssets } from '@/database/schema/inventory';
import { InferInsertModel } from 'drizzle-orm';

export type FixedAsset = InferInsertModel<typeof fixedAssets>;

export interface FixedAssetWithRelations extends FixedAsset {
  categoryName?: string | null;
}
