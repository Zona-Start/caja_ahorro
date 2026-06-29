ALTER TABLE "treasury"."bank_accounts" ALTER COLUMN "linked_chart_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ADD COLUMN "internal_code" varchar(20) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_trans_internal_code_uidx" ON "treasury"."bank_transactions" USING btree ("tenant_id","internal_code");