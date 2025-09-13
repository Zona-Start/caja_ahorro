CREATE VIEW "inventory"."inventory_availability" AS (
  SELECT
    item_id AS item_id,
    item_type AS item_type,
    SUM(
      CASE
        WHEN movement_type = 'IN' THEN quantity
        WHEN movement_type = 'OUT' THEN -quantity
        ELSE quantity -- Ajustes u otros tipos se toman con su signo
      END
    ) AS available_quantity
  FROM "inventory"."inventory_movements"
  GROUP BY item_id, item_type
);