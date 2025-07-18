import { products } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type Product = InferInsertModel<typeof products>;
