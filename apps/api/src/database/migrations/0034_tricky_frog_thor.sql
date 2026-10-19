ALTER TABLE "inventory"."service_prices" ADD COLUMN "sales_exchange_rate" numeric(18, 6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ADD COLUMN "sale_price" numeric(18, 6);--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ADD COLUMN "sales_tax_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL;