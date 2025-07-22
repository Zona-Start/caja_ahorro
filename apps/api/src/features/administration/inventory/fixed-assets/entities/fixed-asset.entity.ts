import { fixedAssets } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type FixedAsset = InferInsertModel<typeof fixedAssets>;

export interface FixedAssetWithRelations extends FixedAsset {
  categoryName?: string | null;
}
