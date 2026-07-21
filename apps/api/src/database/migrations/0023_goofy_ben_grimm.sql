ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "bank_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;