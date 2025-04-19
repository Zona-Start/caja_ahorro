DROP INDEX "core"."category_types_group_code_uidx";--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ALTER COLUMN "closed_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ALTER COLUMN "account_number" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ALTER COLUMN "account_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ALTER COLUMN "linked_chart_account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banking"."bank_directory" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" ALTER COLUMN "balance" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "category_types_group_code_uidx" ON "core"."category_types" USING btree ("group");--> statement-breakpoint
ALTER TABLE "core"."category_types" DROP COLUMN "code";