import { inventoriesCategories } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type InventoriesCategories = InferInsertModel<
  typeof inventoriesCategories
>;
