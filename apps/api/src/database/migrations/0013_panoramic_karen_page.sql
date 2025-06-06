CREATE TYPE "public"."credit_modality_type_enum" AS ENUM('ORDINARY', 'SPECIAL_QUOTAS');--> statement-breakpoint
CREATE TYPE "public"."credit_payment_type_enum" AS ENUM('PAYING', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "public"."credit_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'IN_PAYMENT', 'PAID');--> statement-breakpoint
CREATE TABLE "savings_banks"."credit_amortization_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
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
CREATE TABLE "savings_banks"."credit_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment-type" "credit_payment_type_enum" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"balance_pending" numeric(18, 2) NOT NULL,
	"bank_id" integer NOT NULL,
	"payment_method" "payment_method_enum" NOT NULL,
	"transaction_reference" text,
	"comment" text,
	"custom_reference" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."credit_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_payment_id" integer NOT NULL,
	"installment_id" integer,
	"amount" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."credit_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
	"status" "credit_status_enum" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_user_id" integer,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"credit_type_id" integer NOT NULL,
	"credit_modality" "credit_modality_type_enum" NOT NULL,
	"request_date" date DEFAULT now() NOT NULL,
	"approval_date" date,
	"requested_amount" numeric(18, 2) NOT NULL,
	"start_date" date,
	"end_date" date,
	"total_interest" numeric(18, 2),
	"Installment_amount" numeric(18, 2),
	"total_payable" numeric(18, 2),
	"expenses_amount" numeric(18, 2),
	"overdraft_amount" numeric(18, 2),
	"previous_credit_id" integer,
	"status" "credit_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" integer,
	"notes" text,
	"custom_reference" varchar(50),
	"currency_code" "currency_code_enum",
	"exchange_rate_id" integer,
	"balance_in_favor" numeric(18, 2),
	"commercial_house_id" integer,
	"invoice_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD COLUMN "max_credit_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD COLUMN "min_credit_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_amortization_schedule" ADD CONSTRAINT "credit_amortization_schedule_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_amortization_schedule" ADD CONSTRAINT "credit_amortization_schedule_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_amortization_schedule" ADD CONSTRAINT "credit_amortization_schedule_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payments" ADD CONSTRAINT "credit_payments_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payments" ADD CONSTRAINT "credit_payments_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "banking"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payments" ADD CONSTRAINT "credit_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payments" ADD CONSTRAINT "credit_payments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_credit_payment_id_credit_payments_id_fk" FOREIGN KEY ("credit_payment_id") REFERENCES "savings_banks"."credit_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_installment_id_credit_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings_banks"."credit_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_status_history" ADD CONSTRAINT "credit_status_history_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_status_history" ADD CONSTRAINT "credit_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings_banks"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_credit_type_id_credits_types_id_fk" FOREIGN KEY ("credit_type_id") REFERENCES "savings_banks"."credits_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_previous_credit_id_credits_id_fk" FOREIGN KEY ("previous_credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD CONSTRAINT "credits_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_amort_credit_installment_uidx" ON "savings_banks"."credit_amortization_schedule" USING btree ("credit_id","installment_number");--> statement-breakpoint
CREATE INDEX "credit_amort_due_date_status_idx" ON "savings_banks"."credit_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_payments_uidx" ON "savings_banks"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_date_idx" ON "savings_banks"."credit_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "credit_payments_reference_idx" ON "savings_banks"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_transaction_reference_idx" ON "savings_banks"."credit_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_details_installment_idx" ON "savings_banks"."credit_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "credit_status_history_idx" ON "savings_banks"."credit_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_associate_idx" ON "savings_banks"."credits" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "credit_status_date_idx" ON "savings_banks"."credits" USING btree ("status","request_date");--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" DROP COLUMN "max_loan_amount";--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" DROP COLUMN "min_loan_amount";