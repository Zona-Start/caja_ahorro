import { inventoriesCategories } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type InventoriesCategories = InferInsertModel<
  typeof inventoriesCategories
>;
