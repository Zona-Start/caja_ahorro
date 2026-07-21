CREATE VIEW "inventory"."inventory_availability" AS (
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
  FROM "inventory"."inventory_movements" im
  INNER JOIN "inventory"."inventory_movement_items" imi ON imi.movement_id = im.id
  GROUP BY imi.product_id, im.tenant_id
);