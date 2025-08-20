ALTER TABLE "accounts_payable"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_fixed_asset_id_fixed_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_expense_account_id_account_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD COLUMN "itemId" integer;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP COLUMN "fixed_asset_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP COLUMN "service_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" DROP COLUMN "expense_account_id";