import { inventoryMovements } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type InventoryMovement = InferInsertModel<typeof inventoryMovements>;
