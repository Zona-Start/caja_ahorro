ALTER TABLE "inventory"."product_prices" DROP CONSTRAINT "product_prices_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" DROP COLUMN "supplier_id";