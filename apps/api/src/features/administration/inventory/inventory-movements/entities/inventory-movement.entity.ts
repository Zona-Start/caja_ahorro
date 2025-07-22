import { inventoryMovements } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type InventoryMovement = InferInsertModel<typeof inventoryMovements>;
