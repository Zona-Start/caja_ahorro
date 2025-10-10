import { products } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type Product = InferInsertModel<typeof products>;
