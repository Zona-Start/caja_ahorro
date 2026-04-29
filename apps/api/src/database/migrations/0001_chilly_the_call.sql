CREATE TABLE "core"."global_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"is_encrypted" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "global_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "core"."module_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"module" varchar(50) NOT NULL,
	"submodule" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"is_encrypted" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ALTER COLUMN "voucher_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_balance_history" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_balance_history" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_accounts" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_accounts" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associates" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associates" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_directory" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_directory" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."categories" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."categories" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."categories" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_item_sales" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_item_sales" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payment_details" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payment_details" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."currencies" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."currencies" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets_prices" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets_prices" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."internal_transaction_bank_links" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."internal_transaction_bank_links" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."inventories_categories" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."inventories_categories" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payment_details" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payment_details" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."localities" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."localities" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."parishes" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."parishes" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batch_items" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batch_items" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."permissions" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."permissions" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."products" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."products" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."roles" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."roles" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."services" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory"."services" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."states" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."states" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payment_lines" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payment_lines" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transaction_applications" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transaction_applications" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."tenant_members" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."tenant_members" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_settings" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_settings" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user_permissions" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user_permissions" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ALTER COLUMN "updated_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD COLUMN "updated_by_id" uuid;--> statement-breakpoint
ALTER TABLE "core"."currencies" ADD COLUMN "is_base" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "core"."module_settings" ADD CONSTRAINT "module_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_settings_key_idx" ON "core"."global_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "global_settings_category_idx" ON "core"."global_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "module_settings_tenant_idx" ON "core"."module_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "module_settings_module_idx" ON "core"."module_settings" USING btree ("tenant_id","module");--> statement-breakpoint
CREATE UNIQUE INDEX "module_settings_composite_key_uidx" ON "core"."module_settings" USING btree ("tenant_id","module","submodule","key");