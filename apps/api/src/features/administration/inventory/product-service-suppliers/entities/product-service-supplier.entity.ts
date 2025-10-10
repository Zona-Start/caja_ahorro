import { productServiceSuppliers } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type ProductServiceSupplier = InferInsertModel<
  typeof productServiceSuppliers
>;
