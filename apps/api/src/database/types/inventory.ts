import {
  inventoriesCategories,
  inventoryMovements,
} from '../schema/tables/inventory';

export type InventoryCategory = typeof inventoriesCategories.$inferSelect;
export type NewInventoryCategory = typeof inventoriesCategories.$inferInsert;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
