ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP CONSTRAINT "supplier_invoice_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP CONSTRAINT "supplier_invoice_items_fixed_asset_id_fixed_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP CONSTRAINT "supplier_invoice_items_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD COLUMN "item_id" integer;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP COLUMN "fixed_asset_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP COLUMN "service_id";--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" DROP COLUMN "expense_account_id";