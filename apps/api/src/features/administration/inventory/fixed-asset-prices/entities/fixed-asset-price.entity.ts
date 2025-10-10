import { fixedAssetsPrices } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type FixedAssetPrice = InferInsertModel<typeof fixedAssetsPrices>;
