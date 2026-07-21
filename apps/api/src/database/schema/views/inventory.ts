import { sql } from 'drizzle-orm';
import { numeric, uuid, varchar } from 'drizzle-orm/pg-core';
import { inventorySchema } from '../_schemas';
import { inventoryMovementItems, inventoryMovements } from '../tables';

//Cantidad disponible por ítem según movimientos de inventario.
export const inventoryAvailability = inventorySchema.view(
    'inventory_availability',
    {
        itemId: uuid('item_id').notNull(),
        itemType: varchar('item_type', { length: 50 }).notNull(),
        availableQuantity: numeric('available_quantity', { precision: 12, scale: 4 }).notNull(),
        tenantId: uuid('tenant_id').notNull(),
    },
).as(sql`
  SELECT
    imi.product_id AS item_id,
    'PRODUCT' AS item_type,
    SUM(
      CASE
        WHEN im.movement_type IN ('PURCHASE_RECEIPT','CUSTOMER_RETURN','INTERNAL_TRANSFER_IN','INVENTORY_ADJUSTMENT_IN','PRODUCTION_OUTPUT') THEN imi.quantity
        WHEN im.movement_type IN ('SUPPLIER_RETURN','STOCK_DELIVERY','INTERNAL_TRANSFER_OUT','INVENTORY_ADJUSTMENT_OUT','STOCK_WASTE','INTERNAL_CONSUMPTION','PRODUCTION_CONSUMPTION') THEN -imi.quantity
        ELSE 0
      END
    ) AS available_quantity,
    im.tenant_id
  FROM ${inventoryMovements} im
  INNER JOIN ${inventoryMovementItems} imi ON imi.movement_id = im.id
  GROUP BY imi.product_id, im.tenant_id
`);
