import { fixedAssetsPrices } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type FixedAssetPrice = InferInsertModel<typeof fixedAssetsPrices>;
