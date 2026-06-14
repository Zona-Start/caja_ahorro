import { sql } from 'drizzle-orm';
import { integer, uuid, varchar } from 'drizzle-orm/pg-core';
import { inventorySchema } from '../_schemas';
import { inventoryMovements } from '../tables';

//Cantidad disponible por ítem según movimientos de inventario.
export const inventoryAvailability = inventorySchema.view(
  'inventory_availability',
  {
    itemId: uuid('item_id').notNull(),
    itemType: varchar('item_type', { length: 50 }).notNull(),
    availableQuantity: integer('available_quantity').notNull(),
    tenantId: uuid('tenant_id').notNull(),
  },
).as(sql`
  SELECT
    item_id,
    item_type,
    SUM(
      CASE
        WHEN movement_type IN ('IN','ADJUST_IN') THEN quantity
        WHEN movement_type IN ('OUT','ADJUST_OUT') THEN -quantity
        ELSE quantity
      END
    ) AS available_quantity,
    tenant_id
  FROM ${inventoryMovements}
  GROUP BY item_id, item_type, tenant_id
`);
