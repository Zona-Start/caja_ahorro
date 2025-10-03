ALTER TABLE "accounting"."accounting_configuration" ALTER COLUMN "debit_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ALTER COLUMN "credit_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD COLUMN "contra_account_id" integer;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD COLUMN "opening_conciliation_posted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_contra_account_id_account_plan_id_fk" FOREIGN KEY ("contra_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE no action ON UPDATE no action;