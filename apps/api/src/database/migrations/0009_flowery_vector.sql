ALTER TABLE "administration"."supplier_payments" ADD COLUMN "bank_reference" varchar(50);--> statement-breakpoint
ALTER TABLE "administration"."supplier_payments" ADD COLUMN "bank_description" varchar(255);--> statement-breakpoint
ALTER TABLE "administration"."supplier_payments" ADD COLUMN "bank_transaction_date" date;