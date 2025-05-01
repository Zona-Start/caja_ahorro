ALTER TYPE "public"."associate_movement_type_enum" ADD VALUE 'WITHDRAWAL_FEE_DEBIT' BEFORE 'OTHER_DEBIT';--> statement-breakpoint
ALTER TYPE "public"."associate_movement_type_enum" ADD VALUE 'LOAN_INTEREST_DEBIT' BEFORE 'OTHER_DEBIT';--> statement-breakpoint
ALTER TYPE "public"."associate_movement_type_enum" ADD VALUE 'FEE_REIMBURSEMENT_CREDIT';--> statement-breakpoint
ALTER TYPE "public"."payment_method_enum" ADD VALUE 'MOBILE_PAYMENT';--> statement-breakpoint
CREATE TABLE "savings_banks"."associate_account_balance_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_account_id" integer NOT NULL,
	"balance_date" timestamp DEFAULT now() NOT NULL,
	"balance" numeric(18, 2) NOT NULL,
	"movement_id" integer,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."withdrawal_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" varchar(255) NOT NULL,
	"withdrawal_percentage" numeric(5, 2),
	"account_debit" integer,
	"expense_account" integer,
	"administrative_fee_percentage" numeric(5, 2) DEFAULT '0.00',
	"withdrawal_limit_quantity" integer,
	"minimum_antiquity_days" integer,
	"category_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "withdrawal_types_description_unique" UNIQUE("description")
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_account_id" integer NOT NULL,
	"withdrawal_type_id" integer,
	"withdrawal_date" timestamp DEFAULT now() NOT NULL,
	"requested_amount" numeric(18, 2) NOT NULL,
	"administrative_fee" numeric(18, 2) DEFAULT '0.00',
	"disbursed_amount" numeric(18, 2),
	"payment_method" "payment_method_enum",
	"reference_code" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "withdrawals_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" DROP CONSTRAINT "associate_account_movements_accounting_entry_id_accounting_entries_id_fk";
--> statement-breakpoint
DROP INDEX "savings_banks"."assoc_acct_mov_acct_entry_idx";--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ALTER COLUMN "interest_rate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD COLUMN "exchange_rate_id" integer;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_movement_id_associate_account_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "savings_banks"."associate_account_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_account_debit_account_plan_id_fk" FOREIGN KEY ("account_debit") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_expense_account_account_plan_id_fk" FOREIGN KEY ("expense_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_category_id_category_types_id_fk" FOREIGN KEY ("category_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals" ADD CONSTRAINT "withdrawals_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals" ADD CONSTRAINT "withdrawals_withdrawal_type_id_withdrawal_types_id_fk" FOREIGN KEY ("withdrawal_type_id") REFERENCES "savings_banks"."withdrawal_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals" ADD CONSTRAINT "withdrawals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals" ADD CONSTRAINT "withdrawals_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_account_date_idx" ON "savings_banks"."associate_account_balance_history" USING btree ("associate_account_id","balance_date");--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_movement_idx" ON "savings_banks"."associate_account_balance_history" USING btree ("movement_id");--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_exchange_rate_idx" ON "savings_banks"."associate_account_movements" USING btree ("exchange_rate_id");--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" DROP COLUMN "movement_sign";--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" DROP COLUMN "accounting_entry_id";--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" DROP COLUMN "exchange_rate_used";--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" DROP COLUMN "amount_base_currency";