import { salesProducts } from '@/database/schema/inventory';
import { InferInsertModel } from 'drizzle-orm';

export type SalesProduct = InferInsertModel<typeof salesProducts>;
