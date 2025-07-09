import { fixedAssetCategories } from '@/database/schema/inventory';
import { InferInsertModel } from 'drizzle-orm';

export type FixedAssetCategory = InferInsertModel<typeof fixedAssetCategories>;
