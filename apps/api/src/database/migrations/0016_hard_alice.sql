CREATE TYPE "treasury"."expense_report_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID');--> statement-breakpoint
CREATE TYPE "treasury"."expense_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "treasury"."petty_cash_settlement_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "treasury"."petty_cash_voucher_status" AS ENUM('OPEN', 'LIQUIDATED');--> statement-breakpoint
CREATE TYPE "treasury"."recurring_frequency" AS ENUM('MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL');--> statement-breakpoint
CREATE TABLE "treasury"."expense_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"tax_rate" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"is_exempt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury"."expense_report_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"receipt_image_url" text,
	"expense_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury"."expense_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"total_amount" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"status" "treasury"."expense_report_status" DEFAULT 'PENDING' NOT NULL,
	"payment_source" "treasury"."expense_payment_source",
	"bank_account_id" uuid,
	"petty_cash_fund_id" uuid,
	"approved_by_user_id" uuid,
	"approved_at" timestamp,
	"rejected_by_user_id" uuid,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"paid_at" timestamp,
	"paid_expense_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."petty_cash_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fund_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"opening_balance" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"vouchers_total" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"expenses_total" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"replenishments_total" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
	"physical_count" numeric(18, 4),
	"difference" numeric(18, 4),
	"notes" text,
	"status" "treasury"."petty_cash_settlement_status" DEFAULT 'OPEN' NOT NULL,
	"closed_by_user_id" uuid,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."petty_cash_vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fund_id" uuid NOT NULL,
	"voucher_number" varchar(30) NOT NULL,
	"beneficiary_name" varchar(255) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"concept" text NOT NULL,
	"ticket_image_url" text,
	"voucher_date" timestamp DEFAULT now() NOT NULL,
	"status" "treasury"."petty_cash_voucher_status" DEFAULT 'OPEN' NOT NULL,
	"expense_id" uuid,
	"liquidated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."recurring_expense_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"supplier_id" uuid,
	"cost_center_id" uuid,
	"amount" numeric(18, 4) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"frequency" "treasury"."recurring_frequency" DEFAULT 'MONTHLY' NOT NULL,
	"day_of_month" integer DEFAULT 1,
	"next_run_date" timestamp,
	"last_run_at" timestamp,
	"auto_create" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "status" "treasury"."expense_status" DEFAULT 'PENDING_APPROVAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "recurring_template_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "expense_report_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "rejected_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "treasury"."expense_details" ADD CONSTRAINT "expense_details_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "treasury"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_details" ADD CONSTRAINT "expense_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_details" ADD CONSTRAINT "expense_details_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "treasury"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_report_items" ADD CONSTRAINT "expense_report_items_report_id_expense_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "treasury"."expense_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_report_items" ADD CONSTRAINT "expense_report_items_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "treasury"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_employee_user_id_users_id_fk" FOREIGN KEY ("employee_user_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_petty_cash_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("petty_cash_fund_id") REFERENCES "treasury"."petty_cash_funds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."expense_reports" ADD CONSTRAINT "expense_reports_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD CONSTRAINT "petty_cash_settlements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD CONSTRAINT "petty_cash_settlements_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "treasury"."petty_cash_funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD CONSTRAINT "petty_cash_settlements_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_vouchers" ADD CONSTRAINT "petty_cash_vouchers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_vouchers" ADD CONSTRAINT "petty_cash_vouchers_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "treasury"."petty_cash_funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."recurring_expense_templates" ADD CONSTRAINT "recurring_expense_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."recurring_expense_templates" ADD CONSTRAINT "recurring_expense_templates_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "treasury"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."recurring_expense_templates" ADD CONSTRAINT "recurring_expense_templates_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."recurring_expense_templates" ADD CONSTRAINT "recurring_expense_templates_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "treasury"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_details_expense_idx" ON "treasury"."expense_details" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expense_details_category_idx" ON "treasury"."expense_details" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expense_report_items_report_idx" ON "treasury"."expense_report_items" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "expense_reports_tenant_idx" ON "treasury"."expense_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "expense_reports_employee_idx" ON "treasury"."expense_reports" USING btree ("employee_user_id");--> statement-breakpoint
CREATE INDEX "expense_reports_status_idx" ON "treasury"."expense_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "petty_cash_settlements_fund_idx" ON "treasury"."petty_cash_settlements" USING btree ("fund_id");--> statement-breakpoint
CREATE INDEX "petty_cash_settlements_period_idx" ON "treasury"."petty_cash_settlements" USING btree ("tenant_id","period");--> statement-breakpoint
CREATE INDEX "petty_cash_vouchers_fund_idx" ON "treasury"."petty_cash_vouchers" USING btree ("fund_id");--> statement-breakpoint
CREATE INDEX "petty_cash_vouchers_status_idx" ON "treasury"."petty_cash_vouchers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recurring_templates_tenant_idx" ON "treasury"."recurring_expense_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "recurring_templates_next_run_idx" ON "treasury"."recurring_expense_templates" USING btree ("is_active","next_run_date");--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;