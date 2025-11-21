CREATE TABLE "accounting"."accounting_closings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"accounting_cycle_id" integer NOT NULL,
	"closing_type" "closing_type" NOT NULL,
	"period" date NOT NULL,
	"closing_timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"status" "closing_status" DEFAULT 'SUCCESS' NOT NULL,
	"notes" text,
	"processed_entry_id" integer,
	"error_details" text,
	CONSTRAINT "accounting_closings_unique_period" UNIQUE("company_id","period","closing_type")
);
--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_accounting_cycle_id_accounting_cycles_id_fk" FOREIGN KEY ("accounting_cycle_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_closings" ADD CONSTRAINT "accounting_closings_processed_entry_id_accounting_entries_id_fk" FOREIGN KEY ("processed_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounting_closings_company_idx" ON "accounting"."accounting_closings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "accounting_closings_period_idx" ON "accounting"."accounting_closings" USING btree ("period");