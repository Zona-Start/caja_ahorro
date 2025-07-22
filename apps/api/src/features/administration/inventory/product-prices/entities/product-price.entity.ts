import { productPrices } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type ProductPrice = InferInsertModel<typeof productPrices>;
