CREATE SCHEMA "accounting";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "banking";
--> statement-breakpoint
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "savings_banks";
--> statement-breakpoint
CREATE TYPE "public"."account_nature_enum" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "public"."account_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'MEMORANDUM');--> statement-breakpoint
CREATE TYPE "public"."audit_action_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PROCESS');--> statement-breakpoint
CREATE TYPE "public"."audit_auth_action_enum" AS ENUM('LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "public"."associate_account_type_enum" AS ENUM('SAVINGS', 'EMPLOYER_CONTRIBUTION', 'MANDATORY_SAVINGS');--> statement-breakpoint
CREATE TYPE "public"."associate_movement_type_enum" AS ENUM('SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'DIVIDEND_CREDIT', 'LOAN_DISBURSEMENT_CREDIT', 'OTHER_CREDIT', 'SAVING_WITHDRAWAL', 'LOAN_PAYMENT_DEBIT', 'FEE_DEBIT', 'WITHDRAWAL_FEE_DEBIT', 'LOAN_INTEREST_DEBIT', 'OTHER_DEBIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'FEE_REIMBURSEMENT_CREDIT', 'FEE_CORRECTION_DEBIT');--> statement-breakpoint
CREATE TYPE "public"."currency_code_enum" AS ENUM('VES', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."cycle_status_enum" AS ENUM('OPEN', 'CLOSED', 'CLOSING');--> statement-breakpoint
CREATE TYPE "auth"."gender" AS ENUM('FEMENINO', 'MASCULINO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."loan_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'IN_PAYMENT', 'PAID', 'CANCELLED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."nationality" AS ENUM('VENEZOLANO', 'EXTRANJERO');--> statement-breakpoint
CREATE TYPE "public"."payment_method_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'CHECK', 'DEPOSIT', 'OTHER', 'MOBILE_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_item_status_enum" AS ENUM('PENDING', 'RECONCILED', 'MANUAL_MATCH', 'ADJUSTMENT', 'EXCLUDED');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'CLOSED', 'LOCKED', 'RETIRED');--> statement-breakpoint
CREATE TABLE "accounting"."account_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"account_type" "account_type_enum" NOT NULL,
	"nature" "account_nature_enum" NOT NULL,
	"level" integer NOT NULL,
	"allows_movements" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true,
	"parent_account_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"operation_type" varchar(100) NOT NULL,
	"description_template" text,
	"debit_account_id" integer NOT NULL,
	"credit_account_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "cycle_status_enum" DEFAULT 'OPEN' NOT NULL,
	"description" text NOT NULL,
	"closed_by_user_id" integer,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"accounting_cycle_id" integer NOT NULL,
	"entry_date" date NOT NULL,
	"description" text NOT NULL,
	"origin_reference_id" text,
	"origin_type" varchar(50),
	"status" "status_enum" DEFAULT 'PENDING' NOT NULL,
	"posted_at" timestamp,
	"currency_code" "currency_code_enum" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_entry_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"accounting_entry_id" integer NOT NULL,
	"account_plan_id" integer NOT NULL,
	"debit" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "debit_credit_check" CHECK (("accounting"."accounting_entry_details"."debit" > 0 AND "accounting"."accounting_entry_details"."credit" = 0) OR ("accounting"."accounting_entry_details"."debit" = 0 AND "accounting"."accounting_entry_details"."credit" > 0) OR ("accounting"."accounting_entry_details"."debit" = 0 AND "accounting"."accounting_entry_details"."credit" = 0)),
	CONSTRAINT "amount_positive_check" CHECK ("accounting"."accounting_entry_details"."debit" >= 0 AND "accounting"."accounting_entry_details"."credit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "core"."activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"action" "audit_action_enum" NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "audit"."audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"action" "audit_action_enum" NOT NULL,
	"user_id" integer,
	"area" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"previous_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "auth"."roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "auth"."roles_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer,
	"permissions_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"fullname" text NOT NULL,
	"phone" text,
	"password" text NOT NULL,
	"is_two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth"."user_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"role_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"code" integer,
	"expires" timestamp NOT NULL,
	"ip_address" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking"."bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"bank_directory_id" integer NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(255),
	"account_type" varchar(50) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"opening_date" date,
	"current_balance" numeric(18, 2) DEFAULT '0.00',
	"last_statement_balance" numeric(18, 2),
	"last_statement_date" date,
	"linked_chart_account_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "bank_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "banking"."bank_directory" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"country_code" varchar(3) DEFAULT 'VEN',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "bank_directory_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "banking"."bank_reconciliation_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_reconciliation_id" integer NOT NULL,
	"bank_transaction_id" integer,
	"accounting_entry_detail_id" integer,
	"adjustment_type" varchar(50),
	"adjustment_amount" numeric(18, 2),
	"description" text,
	"is_book_adjustment" boolean DEFAULT false,
	"adjustment_entry_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "bank_reconciliation_details_bank_transaction_id_unique" UNIQUE("bank_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "banking"."bank_reconciliations" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_account_id" integer NOT NULL,
	"statement_date" date NOT NULL,
	"statement_ending_balance" numeric(18, 2) NOT NULL,
	"book_balance_before" numeric(18, 2) NOT NULL,
	"book_balance_after" numeric(18, 2),
	"difference" numeric(18, 2),
	"reconciliation_date" timestamp DEFAULT now(),
	"status" "reconciliation_status_enum" DEFAULT 'IN_PROGRESS' NOT NULL,
	"prepared_by_user_id" integer,
	"reviewed_by_user_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "banking"."bank_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_account_id" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"value_date" date,
	"description" text NOT NULL,
	"bank_reference" varchar(100),
	"debit_amount" numeric(18, 2) DEFAULT '0.00',
	"credit_amount" numeric(18, 2) DEFAULT '0.00',
	"resulting_balance" numeric(18, 2),
	"reconciliation_status" "reconciliation_item_status_enum" DEFAULT 'PENDING' NOT NULL,
	"bank_reconciliation_id" integer,
	"upload_batch_id" text,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."category_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"group" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"options" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."company" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"rif" varchar(20) NOT NULL,
	"address" text,
	"phone" varchar(50),
	"email" varchar(100),
	"contact_person" text,
	"contact_phone" varchar(50),
	"contact_email" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "company_rif_unique" UNIQUE("rif"),
	CONSTRAINT "company_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "core"."currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" "currency_code_enum" NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(5),
	"decimal_places" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "core"."exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"from_currency_code" "currency_code_enum" NOT NULL,
	"to_currency_code" "currency_code_enum" NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"source" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"municipality_id" integer NOT NULL,
	"parish_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "localities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "core"."municipalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."parishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"municipality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "core"."system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"group" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "core"."type_payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"deferred_date" date,
	"date_canceled" date,
	"deferred_number" integer,
	"number_canceled" integer,
	"group" varchar(100) NOT NULL,
	"metadata" jsonb,
	"associated_account" integer,
	"employer_account" integer,
	"loan_account" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
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
CREATE TABLE "savings_banks"."associate_account_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_account_id" integer NOT NULL,
	"movement_type" "associate_movement_type_enum" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"reference_id" text,
	"reference_type" varchar(50),
	"reference_number" varchar(20) NOT NULL,
	"exchange_rate_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "associate_account_movements_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."associate_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"associated_id" integer,
	"account_number" varchar(20) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"opening_date" date DEFAULT now(),
	"closing_date" date,
	"bank_id" integer,
	"status" "status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "associate_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"cedula" varchar(20) NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"nationality" "nationality" NOT NULL,
	"gender" "auth"."gender",
	"birthdate" date,
	"admission_date" date NOT NULL,
	"graduation_date" date,
	"discount_frequency_id" integer,
	"status" "status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"is_payroll_credit" boolean DEFAULT false NOT NULL,
	"locality_id" integer,
	"phone" varchar(50),
	"email" varchar(100),
	"payroll_type_id" integer,
	"associated_type_id" integer,
	"job_title" text,
	"base_salary" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "associates_cedula_unique" UNIQUE("cedula")
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_amortization_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(18, 2) NOT NULL,
	"interest_amount" numeric(18, 2) NOT NULL,
	"total_installment_amount" numeric(18, 2) NOT NULL,
	"principal_balance_pending" numeric(18, 2) NOT NULL,
	"payment_status" "payment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0.00',
	"last_payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"installment_id" integer,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"bank_id" integer NOT NULL,
	"payment_method" "payment_method_enum" NOT NULL,
	"transaction_reference" text,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"status" "loan_status_enum" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_user_id" integer,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"interest_rate" numeric(5, 2) NOT NULL,
	"term_type" varchar(20) NOT NULL,
	"term_units" integer NOT NULL,
	"cancellation_percentage" numeric(5, 2),
	"loan_account_chart_id" integer NOT NULL,
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
CREATE TABLE "savings_banks"."loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"loan_type_id" integer NOT NULL,
	"request_date" date DEFAULT now() NOT NULL,
	"approval_date" date,
	"disbursement_date" date,
	"requested_amount" numeric(18, 2) NOT NULL,
	"approved_amount" numeric(18, 2),
	"disbursed_amount" numeric(18, 2),
	"start_date" date,
	"end_date" date,
	"total_interest" numeric(18, 2),
	"total_payable" numeric(18, 2),
	"expenses_amount" numeric(18, 2),
	"overdraft_amount" numeric(18, 2),
	"previous_loan_id" integer,
	"payment_method" "payment_method_enum",
	"disbursement_account_id" integer,
	"status" "loan_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" integer,
	"disbursed_by_user_id" integer,
	"notes" text,
	"custom_reference" varchar(50),
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
CREATE TABLE "savings_banks"."withdrawals_associates" (
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
	CONSTRAINT "withdrawals_associates_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_parent_account_id_account_plan_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_debit_account_id_account_plan_id_fk" FOREIGN KEY ("debit_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_credit_account_id_account_plan_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_configuration" ADD CONSTRAINT "accounting_configuration_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_accounting_cycle_id_accounting_cycles_id_fk" FOREIGN KEY ("accounting_cycle_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_accounting_entry_id_accounting_entries_id_fk" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."permissions" ADD CONSTRAINT "permissions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."permissions" ADD CONSTRAINT "permissions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles" ADD CONSTRAINT "roles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles" ADD CONSTRAINT "roles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_permissions_id_permissions_id_fk" FOREIGN KEY ("permissions_id") REFERENCES "auth"."permissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD CONSTRAINT "bank_accounts_bank_directory_id_bank_directory_id_fk" FOREIGN KEY ("bank_directory_id") REFERENCES "banking"."bank_directory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD CONSTRAINT "bank_accounts_linked_chart_account_id_account_plan_id_fk" FOREIGN KEY ("linked_chart_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_accounts" ADD CONSTRAINT "bank_accounts_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_directory" ADD CONSTRAINT "bank_directory_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_directory" ADD CONSTRAINT "bank_directory_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_bank_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("bank_reconciliation_id") REFERENCES "banking"."bank_reconciliations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "banking"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_accounting_entry_detail_id_accounting_entry_details_id_fk" FOREIGN KEY ("accounting_entry_detail_id") REFERENCES "accounting"."accounting_entry_details"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_adjustment_entry_id_accounting_entries_id_fk" FOREIGN KEY ("adjustment_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "banking"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_prepared_by_user_id_users_id_fk" FOREIGN KEY ("prepared_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "banking"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_transactions" ADD CONSTRAINT "bank_transactions_bank_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("bank_reconciliation_id") REFERENCES "banking"."bank_reconciliations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_transactions" ADD CONSTRAINT "bank_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."bank_transactions" ADD CONSTRAINT "bank_transactions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."category_types" ADD CONSTRAINT "category_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."category_types" ADD CONSTRAINT "category_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."currencies" ADD CONSTRAINT "currencies_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."currencies" ADD CONSTRAINT "currencies_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ADD CONSTRAINT "exchange_rates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "core"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "core"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "core"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ADD CONSTRAINT "municipalities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "core"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ADD CONSTRAINT "municipalities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ADD CONSTRAINT "municipalities_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."parishes" ADD CONSTRAINT "parishes_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "core"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."parishes" ADD CONSTRAINT "parishes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."parishes" ADD CONSTRAINT "parishes_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."states" ADD CONSTRAINT "states_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."states" ADD CONSTRAINT "states_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."system_settings" ADD CONSTRAINT "system_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."system_settings" ADD CONSTRAINT "system_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."type_payrolls" ADD CONSTRAINT "type_payrolls_associated_account_account_plan_id_fk" FOREIGN KEY ("associated_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."type_payrolls" ADD CONSTRAINT "type_payrolls_employer_account_account_plan_id_fk" FOREIGN KEY ("employer_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."type_payrolls" ADD CONSTRAINT "type_payrolls_loan_account_account_plan_id_fk" FOREIGN KEY ("loan_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."type_payrolls" ADD CONSTRAINT "type_payrolls_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."type_payrolls" ADD CONSTRAINT "type_payrolls_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_movement_id_associate_account_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "savings_banks"."associate_account_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" ADD CONSTRAINT "associate_accounts_associated_id_associates_id_fk" FOREIGN KEY ("associated_id") REFERENCES "savings_banks"."associates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" ADD CONSTRAINT "associate_accounts_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "banking"."bank_directory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" ADD CONSTRAINT "associate_accounts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_accounts" ADD CONSTRAINT "associate_accounts_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_locality_id_states_id_fk" FOREIGN KEY ("locality_id") REFERENCES "core"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_payroll_type_id_type_payrolls_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."type_payrolls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_associated_type_id_category_types_id_fk" FOREIGN KEY ("associated_type_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."associates" ADD CONSTRAINT "associates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_installment_id_loan_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings_banks"."loan_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "banking"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_status_history" ADD CONSTRAINT "loan_status_history_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_status_history" ADD CONSTRAINT "loan_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_loan_account_chart_id_account_plan_id_fk" FOREIGN KEY ("loan_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_interest_earned_account_chart_id_account_plan_id_fk" FOREIGN KEY ("interest_earned_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_special_quota_account_chart_id_account_plan_id_fk" FOREIGN KEY ("special_quota_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_expense_account_chart_id_account_plan_id_fk" FOREIGN KEY ("expense_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_payroll_type_id_category_types_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings_banks"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_loan_type_id_loan_types_id_fk" FOREIGN KEY ("loan_type_id") REFERENCES "savings_banks"."loan_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_previous_loan_id_loans_id_fk" FOREIGN KEY ("previous_loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_disbursement_account_id_associate_accounts_id_fk" FOREIGN KEY ("disbursement_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_disbursed_by_user_id_users_id_fk" FOREIGN KEY ("disbursed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_account_debit_account_plan_id_fk" FOREIGN KEY ("account_debit") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_expense_account_account_plan_id_fk" FOREIGN KEY ("expense_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_category_id_category_types_id_fk" FOREIGN KEY ("category_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_withdrawal_type_id_withdrawal_types_id_fk" FOREIGN KEY ("withdrawal_type_id") REFERENCES "savings_banks"."withdrawal_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_plan_code_savings_bank_uidx" ON "accounting"."account_plan" USING btree ("code","company_id");--> statement-breakpoint
CREATE INDEX "account_plan_name_idx" ON "accounting"."account_plan" USING btree ("name");--> statement-breakpoint
CREATE INDEX "account_plan_type_idx" ON "accounting"."account_plan" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "account_plan_parent_idx" ON "accounting"."account_plan" USING btree ("parent_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "acct_config_sb_op_type_uidx" ON "accounting"."accounting_configuration" USING btree ("company_id","operation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_cycles_sb_start_end_uidx" ON "accounting"."accounting_cycles" USING btree ("company_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "accounting_cycles_status_idx" ON "accounting"."accounting_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "accounting_entries_cycle_date_idx" ON "accounting"."accounting_entries" USING btree ("accounting_cycle_id","entry_date");--> statement-breakpoint
CREATE INDEX "accounting_entries_origin_idx" ON "accounting"."accounting_entries" USING btree ("origin_type","origin_reference_id");--> statement-breakpoint
CREATE INDEX "accounting_entries_status_idx" ON "accounting"."accounting_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "acct_entry_details_entry_idx" ON "accounting"."accounting_entry_details" USING btree ("accounting_entry_id");--> statement-breakpoint
CREATE INDEX "acct_entry_details_account_idx" ON "accounting"."accounting_entry_details" USING btree ("account_plan_id");--> statement-breakpoint
CREATE INDEX "activityLogs_idx" ON "core"."activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "auditLogs_table_name_idx" ON "audit"."audit_logs" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "auditLogs_record_idx" ON "audit"."audit_logs" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "auditLogs_action_idx" ON "audit"."audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "auditLogs_area_idx" ON "audit"."audit_logs" USING btree ("area");--> statement-breakpoint
CREATE INDEX "permissions_idx" ON "auth"."permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_idx" ON "auth"."roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_permission_idx01" ON "auth"."roles_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "roles_permission_idx02" ON "auth"."roles_permissions" USING btree ("permissions_id");--> statement-breakpoint
CREATE INDEX "sessions_idx" ON "auth"."sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "users_idx" ON "auth"."users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "auth"."user_role" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_account_number_uidx" ON "banking"."bank_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "bank_accounts_sb_idx" ON "banking"."bank_accounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_currency_idx" ON "banking"."bank_accounts" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "bank_accounts_chart_acc_idx" ON "banking"."bank_accounts" USING btree ("linked_chart_account_id");--> statement-breakpoint
CREATE INDEX "bank_directory_code_idx" ON "banking"."bank_directory" USING btree ("code");--> statement-breakpoint
CREATE INDEX "bank_directory_name_idx" ON "banking"."bank_directory" USING btree ("name");--> statement-breakpoint
CREATE INDEX "bank_recon_details_recon_idx" ON "banking"."bank_reconciliation_details" USING btree ("bank_reconciliation_id");--> statement-breakpoint
CREATE INDEX "bank_recon_details_bank_trans_idx" ON "banking"."bank_reconciliation_details" USING btree ("bank_transaction_id");--> statement-breakpoint
CREATE INDEX "bank_recon_details_acct_entry_detail_idx" ON "banking"."bank_reconciliation_details" USING btree ("accounting_entry_detail_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_recon_account_stmt_date_uidx" ON "banking"."bank_reconciliations" USING btree ("bank_account_id","statement_date");--> statement-breakpoint
CREATE INDEX "bank_recon_status_idx" ON "banking"."bank_reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bank_trans_account_date_idx" ON "banking"."bank_transactions" USING btree ("bank_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX "bank_trans_bank_ref_idx" ON "banking"."bank_transactions" USING btree ("bank_account_id","bank_reference");--> statement-breakpoint
CREATE INDEX "bank_trans_recon_status_idx" ON "banking"."bank_transactions" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "bank_trans_recon_id_idx" ON "banking"."bank_transactions" USING btree ("bank_reconciliation_id");--> statement-breakpoint
CREATE INDEX "category_types_group_desc_idx" ON "core"."category_types" USING btree ("group","description");--> statement-breakpoint
CREATE INDEX "company_name_idx" ON "core"."company" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "company_rif_uidx" ON "core"."company" USING btree ("rif");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_date_from_to_uidx" ON "core"."exchange_rates" USING btree ("date","from_currency_code","to_currency_code");--> statement-breakpoint
CREATE UNIQUE INDEX "localities_index_idx" ON "core"."localities" USING btree ("state_id","municipality_id","parish_id");--> statement-breakpoint
CREATE INDEX "localities_index_00" ON "core"."localities" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "localities_index_idx01" ON "core"."localities" USING btree ("municipality_id");--> statement-breakpoint
CREATE INDEX "localities_index_idx02" ON "core"."localities" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "municipalities_index_idx" ON "core"."municipalities" USING btree ("id","name","state_id");--> statement-breakpoint
CREATE INDEX "parishes_index_idx" ON "core"."parishes" USING btree ("id","name","municipality_id");--> statement-breakpoint
CREATE INDEX "states_name_idx" ON "core"."states" USING btree ("id","name");--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_account_date_idx" ON "savings_banks"."associate_account_balance_history" USING btree ("associate_account_id","balance_date");--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_movement_idx" ON "savings_banks"."associate_account_balance_history" USING btree ("movement_id");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_account_date_idx" ON "savings_banks"."associate_account_movements" USING btree ("associate_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_type_idx" ON "savings_banks"."associate_account_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_reference_idx" ON "savings_banks"."associate_account_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_exchange_rate_idx" ON "savings_banks"."associate_account_movements" USING btree ("exchange_rate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "associate_accounts_account_number_uidx" ON "savings_banks"."associate_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "associate_accounts_associate_idx" ON "savings_banks"."associate_accounts" USING btree ("associated_id");--> statement-breakpoint
CREATE INDEX "associate_accounts_status_idx" ON "savings_banks"."associate_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "associate_accounts_currency_idx" ON "savings_banks"."associate_accounts" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "associate_opening_date_idx" ON "savings_banks"."associate_accounts" USING btree ("opening_date");--> statement-breakpoint
CREATE INDEX "associate_accounts_closing_date_idx" ON "savings_banks"."associate_accounts" USING btree ("closing_date");--> statement-breakpoint
CREATE UNIQUE INDEX "associates_cedula_savings_bank_uidx" ON "savings_banks"."associates" USING btree ("cedula","company_id");--> statement-breakpoint
CREATE INDEX "associates_fullname_idx" ON "savings_banks"."associates" USING btree ("fullname");--> statement-breakpoint
CREATE INDEX "associates_date_admission_idx" ON "savings_banks"."associates" USING btree ("admission_date");--> statement-breakpoint
CREATE INDEX "associates_date_graduation_idx" ON "savings_banks"."associates" USING btree ("graduation_date");--> statement-breakpoint
CREATE INDEX "associates_status_idx" ON "savings_banks"."associates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "associates_is_payroll_credit_idx" ON "savings_banks"."associates" USING btree ("is_payroll_credit");--> statement-breakpoint
CREATE INDEX "associates_payroll_type_idx" ON "savings_banks"."associates" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "associates_type_idx" ON "savings_banks"."associates" USING btree ("associated_type_id");--> statement-breakpoint
CREATE INDEX "associates_locality_idx" ON "savings_banks"."associates" USING btree ("locality_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_amort_loan_installment_uidx" ON "savings_banks"."loan_amortization_schedule" USING btree ("loan_id","installment_number");--> statement-breakpoint
CREATE INDEX "loan_amort_due_date_status_idx" ON "savings_banks"."loan_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE INDEX "loan_types_name_idx" ON "savings_banks"."loan_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "loan_types_loan_account_chart_id_idx" ON "savings_banks"."loan_types" USING btree ("loan_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_interest_earned_account_chart_id_idx" ON "savings_banks"."loan_types" USING btree ("interest_earned_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_special_quota_account_chart_id_idx" ON "savings_banks"."loan_types" USING btree ("special_quota_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_expense_account_chart_id_idx" ON "savings_banks"."loan_types" USING btree ("expense_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_payroll_type_id_idx" ON "savings_banks"."loan_types" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "loans_associate_idx" ON "savings_banks"."loans" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "loans_status_date_idx" ON "savings_banks"."loans" USING btree ("status","request_date");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawal_types_description_uidx" ON "savings_banks"."withdrawal_types" USING btree ("description");--> statement-breakpoint
CREATE INDEX "withdrawal_types_account_debit_idx" ON "savings_banks"."withdrawal_types" USING btree ("account_debit");--> statement-breakpoint
CREATE INDEX "withdrawal_types_expense_account_idx" ON "savings_banks"."withdrawal_types" USING btree ("expense_account");--> statement-breakpoint
CREATE INDEX "withdrawal_types_frequency_relation_idx" ON "savings_banks"."withdrawal_types" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "withdrawals_associate_account_idx" ON "savings_banks"."withdrawals_associates" USING btree ("associate_account_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_type_idx" ON "savings_banks"."withdrawals_associates" USING btree ("withdrawal_type_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_date_idx" ON "savings_banks"."withdrawals_associates" USING btree ("withdrawal_date");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawals_reference_code_uidx" ON "savings_banks"."withdrawals_associates" USING btree ("reference_code");