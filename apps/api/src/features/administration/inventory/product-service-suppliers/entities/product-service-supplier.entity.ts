import { productServiceSuppliers } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type ProductServiceSupplier = InferInsertModel<typeof productServiceSuppliers>;
