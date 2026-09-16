ALTER TABLE "inventory"."products" DROP CONSTRAINT "products_internal_code_unique";--> statement-breakpoint
ALTER TABLE "inventory"."products" DROP CONSTRAINT "products_sku_unique";--> statement-breakpoint
ALTER TABLE "inventory"."services" DROP CONSTRAINT "services_internal_code_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_internal_code_unique" ON "inventory"."products" USING btree ("tenant_id","internal_code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_sku_unique" ON "inventory"."products" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "services_tenant_internal_code_unique" ON "inventory"."services" USING btree ("tenant_id","internal_code");