ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "charge_payment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "payment_bank_reference" varchar(50);--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "payment_description" varchar(255);--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "transaction_date" date;--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "payment_method" "payment_method_enum";--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "bank_account_id" integer;--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "banking"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;