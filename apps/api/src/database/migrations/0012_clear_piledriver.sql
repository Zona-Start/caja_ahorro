CREATE TABLE "savings_banks"."credits_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"interest_rate" numeric(5, 2) NOT NULL,
	"term_type" varchar(20) NOT NULL,
	"term_units" integer NOT NULL,
	"cancellation_percentage" numeric(5, 2),
	"credit_account_chart_id" integer NOT NULL,
	"interest_earned_account_chart_id" integer NOT NULL,
	"special_quota_account_chart_id" integer,
	"expense_account_chart_id" integer,
	"special_quota_number" integer DEFAULT 0,
	"special_quota_percentage" numeric(5, 2) DEFAULT '0',
	"max_loan_amount" numeric(18, 2),
	"min_loan_amount" numeric(18, 2),
	"payroll_type_id" integer,
	"administrative_expense_percentage" numeric(5, 2) DEFAULT '0',
	"minimum_seniority_months" integer DEFAULT 0,
	"accepts_debit_balance" boolean DEFAULT false NOT NULL,
	"accepts_guarantors" boolean DEFAULT false NOT NULL,
	"accepts_availability" boolean DEFAULT false NOT NULL,
	"accepts_refinancing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_credit_account_chart_id_account_plan_id_fk" FOREIGN KEY ("credit_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_interest_earned_account_chart_id_account_plan_id_fk" FOREIGN KEY ("interest_earned_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_special_quota_account_chart_id_account_plan_id_fk" FOREIGN KEY ("special_quota_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_expense_account_chart_id_account_plan_id_fk" FOREIGN KEY ("expense_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_payroll_type_id_category_types_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credits_types_name_idx" ON "savings_banks"."credits_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "credits_types_credit_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("credit_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_interest_earned_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("interest_earned_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_special_quota_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("special_quota_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_expense_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("expense_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_payroll_type_id_idx" ON "savings_banks"."credits_types" USING btree ("payroll_type_id");