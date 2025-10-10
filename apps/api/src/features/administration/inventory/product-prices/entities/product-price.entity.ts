import { productPrices } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type ProductPrice = InferInsertModel<typeof productPrices>;
