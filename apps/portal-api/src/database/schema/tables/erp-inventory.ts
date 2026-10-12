import { uuid, varchar } from 'drizzle-orm/pg-core';
import { inventorySchema } from '../_schemas';

/** inventory.products (solo lo usado por el portal: nombre del producto). */
export const products = inventorySchema.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
});
