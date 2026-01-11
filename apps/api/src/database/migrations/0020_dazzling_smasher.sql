CREATE TABLE "accounting"."accounting_rule_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer,
	"account_role" varchar,
	"movement_type" varchar NOT NULL,
	"formula" text,
	"account_plan_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"operation_type" varchar NOT NULL,
	"reference_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rule_details" ADD CONSTRAINT "accounting_rule_details_rule_id_accounting_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "accounting"."accounting_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rule_details" ADD CONSTRAINT "accounting_rule_details_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD CONSTRAINT "accounting_rules_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE no action ON UPDATE no action;