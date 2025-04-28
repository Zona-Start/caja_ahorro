ALTER TABLE "savings_banks"."associate_accounts" ADD COLUMN "closing_date" date;--> statement-breakpoint
CREATE INDEX "associate_accounts_closing_date_idx" ON "savings_banks"."associate_accounts" USING btree ("closing_date");--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" DROP COLUMN "salary";--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" DROP COLUMN "salary_total";