ALTER TYPE "public"."cycle_status_enum" ADD VALUE 'PENDING';--> statement-breakpoint
CREATE TABLE "accounting"."account_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"account_plan_id" integer NOT NULL,
	"accounting_cycles_id" integer NOT NULL,
	"initial_balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"debit_balance" numeric(20, 6) DEFAULT '0',
	"credit_balance" numeric(20, 6) DEFAULT '0',
	"final_balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "account_balances_unique" UNIQUE("company_id","account_plan_id","accounting_cycles_id")
);
--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_accounting_cycles_id_accounting_cycles_id_fk" FOREIGN KEY ("accounting_cycles_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_balances_cycle_idx" ON "accounting"."account_balances" USING btree ("accounting_cycles_id");--> statement-breakpoint
CREATE INDEX "account_balances_plan_idx" ON "accounting"."account_balances" USING btree ("account_plan_id");
