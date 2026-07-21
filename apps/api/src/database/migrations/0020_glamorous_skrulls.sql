DROP VIEW "purchasing"."supplier_total_360";
DROP VIEW "purchasing"."supplier_advances_360";--> statement-breakpoint
DROP VIEW "purchasing"."supplier_ap_360";--> statement-breakpoint
DROP VIEW "purchasing"."supplier_master_360";--> statement-breakpoint
DROP VIEW "purchasing"."supplier_notes_360";--> statement-breakpoint
DROP VIEW "purchasing"."supplier_payments_360";--> statement-breakpoint
DROP VIEW "purchasing"."supplier_purchases_360";--> statement-breakpoint
DROP VIEW "inventory"."inventory_availability";--> statement-breakpoint

-- 1. ELIMINAR CONSTRAINTS ANTIGUAS
ALTER TABLE "purchasing"."accounts_payable" DROP CONSTRAINT "accounts_payable_ap_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" DROP CONSTRAINT "purchase_orders_order_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" DROP CONSTRAINT "supplier_credit_notes_credit_note_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" DROP CONSTRAINT "supplier_debit_notes_debit_note_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" DROP CONSTRAINT "supplier_invoices_supplier_invoice_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" DROP CONSTRAINT "supplier_payments_payment_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" DROP CONSTRAINT "supplier_transactions_transaction_number_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" DROP CONSTRAINT "suppliers_internal_code_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" DROP CONSTRAINT "suppliers_tax_id_unique";--> statement-breakpoint

-- 2. ELIMINAR ÍNDICES ANTIGUOS
DROP INDEX "purchasing"."supplier_tax_idx";--> statement-breakpoint
DROP INDEX "purchasing"."payable_invoice_uidx";--> statement-breakpoint
DROP INDEX "purchasing"."po_order_number_idx";--> statement-breakpoint
DROP INDEX "purchasing"."si_invoice_unique_idx";--> statement-breakpoint

-- 3. CICLO DE ACTUALIZACIÓN DEL ENUM (Resuelve el error de dependencias)
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "purchasing"."purchase_order_status";--> statement-breakpoint
CREATE TYPE "purchasing"."purchase_order_status" AS ENUM('DRAFT', 'APPROVED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "status" SET DATA TYPE "purchasing"."purchase_order_status" USING "status"::"purchasing"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint

-- 4. ALTERAR COLUMNAS EXISTENTES (Tipos de datos numéricos)
ALTER TABLE "inventory"."inventory_movement_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 4);--> statement-breakpoint

-- 5. AGREGAR NUEVAS COLUMNAS
ALTER TABLE "purchasing"."purchase_order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ADD COLUMN "quantity_received" numeric(12, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ADD COLUMN "quantity_invoiced" numeric(12, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ADD COLUMN "supplier_advance_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "inventory_movement_id" uuid;--> statement-breakpoint

-- 6. AGREGAR LLAVES FORÁNEAS (FKs)
ALTER TABLE "purchasing"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_inventory_movement_id_inventory_movements_id_fk" FOREIGN KEY ("inventory_movement_id") REFERENCES "inventory"."inventory_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- 7. CREAR NUEVOS ÍNDICES
CREATE INDEX "ap_supplier_idx" ON "purchasing"."accounts_payable" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "ap_date_range_idx" ON "purchasing"."accounts_payable" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "ap_invoice_number_idx" ON "purchasing"."accounts_payable" USING btree ("ap_number");--> statement-breakpoint
CREATE INDEX "po_supplier_idx" ON "purchasing"."purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "po_status_idx" ON "purchasing"."purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "po_date_range_idx" ON "purchasing"."purchase_orders" USING btree ("order_date");--> statement-breakpoint
CREATE UNIQUE INDEX "advance_unique_uidx" ON "purchasing"."supplier_advances" USING btree ("tenant_id","supplier_advance_number");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_note_unique_uidx" ON "purchasing"."supplier_credit_notes" USING btree ("tenant_id","credit_note_number");--> statement-breakpoint
CREATE UNIQUE INDEX "debit_note_unique_uidx" ON "purchasing"."supplier_debit_notes" USING btree ("tenant_id","debit_note_number");--> statement-breakpoint
CREATE INDEX "si_supplier_idx" ON "purchasing"."supplier_invoices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "si_status_idx" ON "purchasing"."supplier_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "si_date_range_idx" ON "purchasing"."supplier_invoices" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "si_invoice_number_idx" ON "purchasing"."supplier_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_unique_uidx" ON "purchasing"."supplier_payments" USING btree ("tenant_id","payment_number");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_tenant_internal_code_unique" ON "purchasing"."suppliers" USING btree ("tenant_id","internal_code");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_tenant_tax_unique" ON "purchasing"."suppliers" USING btree ("tenant_id","tax_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payable_invoice_uidx" ON "purchasing"."accounts_payable" USING btree ("tenant_id","ap_number");--> statement-breakpoint
CREATE UNIQUE INDEX "po_order_number_idx" ON "purchasing"."purchase_orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "si_invoice_unique_idx" ON "purchasing"."supplier_invoices" USING btree ("tenant_id","supplier_invoice_number");
