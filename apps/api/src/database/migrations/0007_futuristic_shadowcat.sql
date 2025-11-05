CREATE TYPE "public"."closing_type" AS ENUM('MONTH', 'YEAR');--> statement-breakpoint
CREATE TABLE "accounting"."accounting_closings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"cycle_id" integer NOT NULL,
	"closing_type" "closing_type" NOT NULL,
	"period" date NOT NULL,
	"closed_at" timestamp DEFAULT now() NOT NULL,
	"closed_by" integer NOT NULL,
	CONSTRAINT "accounting_closings_unique_period" UNIQUE("company_id","period","closing_type")
);
--> statement-breakpoint
ALTER TABLE "banking"."internal_transaction_bank_links" DROP CONSTRAINT "internal_transaction_bank_links_bank_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_cycle_id_accounting_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounting_closings_company_idx" ON "accounting"."accounting_closings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "accounting_closings_period_idx" ON "accounting"."accounting_closings" USING btree ("period");