CREATE TYPE "treasury"."cash_movement_reference_type" AS ENUM('EXPENSE', 'SALE', 'MANUAL_ADJUSTMENT', 'PETTY_CASH_REPLENISHMENT', 'PETTY_CASH_DISBURSEMENT', 'CASH_OPENING', 'CASH_CLOSING');--> statement-breakpoint
CREATE TYPE "treasury"."cash_movement_type" AS ENUM('INFLOW', 'OUTFLOW');--> statement-breakpoint
CREATE TYPE "treasury"."cash_session_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "treasury"."expense_payment_source" AS ENUM('CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH');--> statement-breakpoint
CREATE TYPE "treasury"."expense_payment_status" AS ENUM('PAID', 'PENDING');--> statement-breakpoint
CREATE TYPE "treasury"."expense_type" AS ENUM('EXPRESS', 'FORMAL_INVOICE');--> statement-breakpoint
ALTER TYPE "public"."module_code" ADD VALUE 'EXPENSES';--> statement-breakpoint
CREATE TABLE "treasury"."cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "treasury"."cash_movement_type" NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"concept" text NOT NULL,
	"reference_type" "treasury"."cash_movement_reference_type",
	"reference_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury"."cash_register_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_register_id" uuid NOT NULL,
	"opened_by_user_id" uuid NOT NULL,
	"closed_by_user_id" uuid,
	"status" "treasury"."cash_session_status" DEFAULT 'OPEN' NOT NULL,
	"initial_balance" numeric(18, 4) NOT NULL,
	"system_expected_balance" numeric(18, 4) DEFAULT '0.0000',
	"actual_physical_balance" numeric(18, 4),
	"difference" numeric(18, 4),
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."cash_registers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."cost_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"monthly_budget" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"accounting_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid,
	"cost_center_id" uuid,
	"category_id" uuid NOT NULL,
	"payment_source" "treasury"."expense_payment_source" NOT NULL,
	"cash_register_session_id" uuid,
	"bank_account_id" uuid,
	"petty_cash_fund_id" uuid,
	"type" "treasury"."expense_type" DEFAULT 'EXPRESS' NOT NULL,
	"payment_status" "treasury"."expense_payment_status" DEFAULT 'PAID' NOT NULL,
	"amount_base" numeric(18, 4) NOT NULL,
	"tax_amount_base" numeric(18, 4) DEFAULT '0.0000',
	"currency_code" "currency_code" NOT NULL,
	"exchange_rate" numeric(14, 6) NOT NULL,
	"islr_withholding_amount" numeric(18, 4) DEFAULT '0.0000',
	"vat_withholding_amount" numeric(18, 4) DEFAULT '0.0000',
	"receipt_number" varchar(100),
	"receipt_image_url" text,
	"description" text NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"deleted_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "treasury"."petty_cash_funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"custodian_user_id" uuid NOT NULL,
	"assigned_amount" numeric(18, 4) NOT NULL,
	"current_balance" numeric(18, 4) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "treasury"."cash_movements" ADD CONSTRAINT "cash_movements_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "treasury"."cash_register_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cash_movements" ADD CONSTRAINT "cash_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_cash_register_id_cash_registers_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "treasury"."cash_registers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_opened_by_user_id_users_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cash_registers" ADD CONSTRAINT "cash_registers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."cost_centers" ADD CONSTRAINT "cost_centers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_categories" ADD CONSTRAINT "expense_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_categories" ADD CONSTRAINT "expense_categories_accounting_account_id_account_plan_id_fk" FOREIGN KEY ("accounting_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "treasury"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "treasury"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_cash_register_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("cash_register_session_id") REFERENCES "treasury"."cash_register_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_petty_cash_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("petty_cash_fund_id") REFERENCES "treasury"."petty_cash_funds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_custodian_user_id_users_id_fk" FOREIGN KEY ("custodian_user_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_movements_session_idx" ON "treasury"."cash_movements" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "cash_movements_ref_idx" ON "treasury"."cash_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "cash_sessions_register_idx" ON "treasury"."cash_register_sessions" USING btree ("cash_register_id");--> statement-breakpoint
CREATE INDEX "cash_sessions_status_idx" ON "treasury"."cash_register_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cash_registers_tenant_idx" ON "treasury"."cash_registers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "cost_centers_tenant_idx" ON "treasury"."cost_centers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "cost_centers_code_uidx" ON "treasury"."cost_centers" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "expense_categories_tenant_idx" ON "treasury"."expense_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "expenses_tenant_idx" ON "treasury"."expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "expenses_session_idx" ON "treasury"."expenses" USING btree ("cash_register_session_id");--> statement-breakpoint
CREATE INDEX "expenses_bank_idx" ON "treasury"."expenses" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "expenses_petty_cash_idx" ON "treasury"."expenses" USING btree ("petty_cash_fund_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "treasury"."expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_cost_center_idx" ON "treasury"."expenses" USING btree ("cost_center_id");--> statement-breakpoint
CREATE INDEX "petty_cash_tenant_idx" ON "treasury"."petty_cash_funds" USING btree ("tenant_id");