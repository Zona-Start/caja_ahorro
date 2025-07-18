CREATE SCHEMA "accounting";
--> statement-breakpoint
CREATE SCHEMA "accounts_payable";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "banking";
--> statement-breakpoint
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "inventory";
--> statement-breakpoint
CREATE SCHEMA "savings_banks";
--> statement-breakpoint
CREATE TYPE "public"."account_nature_enum" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "public"."account_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'MEMORANDUM');--> statement-breakpoint
CREATE TYPE "public"."audit_action_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'REVERSED', 'CANCELED', 'PROCESS_EXECUTION', 'DATA_IMPORT', 'CONFIGURATION_CHANGE', 'ADJUSTMENT', 'VIEW_REPORT');--> statement-breakpoint
CREATE TYPE "public"."audit_auth_action_enum" AS ENUM('LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "public"."associate_account_type_enum" AS ENUM('SAVINGS', 'EMPLOYER_CONTRIBUTION', 'MANDATORY_SAVINGS');--> statement-breakpoint
CREATE TYPE "public"."associate_movement_type_enum" AS ENUM('SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'VOLUNTARY_SAVINGS', 'SAVING_WITHDRAWAL', 'LOAN_DISBURSEMENT_CREDIT', 'SPECIAL_LOAN_DISBURSEMENT_CREDIT', 'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT', 'SPECIAL_CREDIT_DISBURSEMENT_CREDIT', 'LOAN_REFINANCING_DEBIT', 'LOAN_REFINANCING_CREDIT', 'LOAN_PAYMENT_DEBIT', 'COMMERCIAL_CREDIT_PAYMENT_DEBIT', 'LOAN_REIMBURSEMENT_CREDIT', 'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT', 'LOAN_OVERPAYMENT_CREDIT', 'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT', 'LOAN_PARTIAL_DISBURSEMENT_CREDIT', 'WITHDRAWAL_FEE_DEBIT', 'LOAN_INTEREST_DEBIT', 'LOAN_FEE_DEBIT', 'LOAN_ADMIN_FEE_DEBIT', 'LATE_PAYMENT_FEE_DEBIT', 'PAYMENT_REVERSAL_DEBIT', 'CREDIT_ADMIN_FEE_DEBIT', 'DIVIDEND_CREDIT', 'FEE_REIMBURSEMENT_CREDIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'FEE_CORRECTION_DEBIT', 'ADMIN_FEE_DEBIT', 'OTHER_DEBIT', 'FEE_DEBIT', 'OTHER_CREDIT', 'LIQUIDATION_BALANCE', 'LOAN_DISBURSEMENT_REVERSAL_DEBIT', 'SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT', 'COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', 'SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', 'LOAN_PAYMENT_REVERSAL_CREDIT', 'COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT', 'SAVING_WITHDRAWAL_REVERSAL_CREDIT', 'LIQUIDATION_BALANCE_REVERSAL_CREDIT', 'ACCOUNTING_ADJUSTMENT_DEBIT', 'ACCOUNTING_ADJUSTMENT_CREDIT');--> statement-breakpoint
CREATE TYPE "public"."bank_transaction_category" AS ENUM('MEMBER_DUES', 'LOAN_DISABURSEMENT', 'LOAN_PAYMENT', 'MEMBER_WITHDRAWAL', 'ADMINISTRATIVE_EXPENSES', 'BANK_FEES', 'INTEREST_EARNED', 'TAXES', 'OTHER_INCOME', 'OTHER_EXPENSES', 'INTERNAL_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."category-suppliers" AS ENUM('ASSETS', 'SERVICE', 'PRODUCTS', 'MATERIALS', 'FURNITURE', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."credit_modality_type_enum" AS ENUM('ORDINARY', 'SPECIAL_QUOTAS');--> statement-breakpoint
CREATE TYPE "public"."credit_payment_type_enum" AS ENUM('PAYING', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "public"."credit_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'IN_PAYMENT', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."currency_code_enum" AS ENUM('VES', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."cycle_status_enum" AS ENUM('OPEN', 'CLOSED', 'CLOSING');--> statement-breakpoint
CREATE TYPE "public"."fixed_assets_inventory_status" AS ENUM('ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE', 'DEREGISTERED');--> statement-breakpoint
CREATE TYPE "auth"."gender" AS ENUM('FEMENINO', 'MASCULINO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."internal_link_status" AS ENUM('LINKED', 'UNLINKED', 'PARTIALLY_LINKED', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TYPE "public"."invoice_supplier_status_enum" AS ENUM('OPEN', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."liquidations_status_enum" AS ENUM('REQUESTED', 'PROCESSED', 'REJECTED', 'REVERSED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "public"."loan_modality_type_enum" AS ENUM('ORDINARY', 'SPECIAL_QUOTAS');--> statement-breakpoint
CREATE TYPE "public"."loan_payment_type_enum" AS ENUM('PAYING', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "public"."loan_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'IN_PAYMENT', 'PAID', 'OVERDUE', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "public"."movement_type_inventory" AS ENUM('IN', 'OUT', 'ADJUST_IN', 'ADJUST_OUT', 'TRANSFER', 'COMMIT', 'UN_COMMIT', 'ORDERED', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."nationality" AS ENUM('VENEZOLANO', 'EXTRANJERO');--> statement-breakpoint
CREATE TYPE "public"."payment_accounts_payable_enum" AS ENUM('PENDING', 'PENDING_BANK_BATCH', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'CHECK', 'DEPOSIT', 'OTHER', 'MOBILE_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('DONE', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."price_type_enum" AS ENUM('COST', 'SELLING', 'OFFER');--> statement-breakpoint
CREATE TYPE "public"."product-status" AS ENUM('AVAILABLE', 'DISABLED', 'OUT OF STOCK', 'COMMING SOON', 'ON SALE');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status_enum" AS ENUM('PENDING', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_type_enum" AS ENUM('SALES_INVENTORY', 'FIXED_ASSET', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_item_status_enum" AS ENUM('PENDING', 'RECONCILED', 'MANUAL_MATCH', 'ADJUSTMENT', 'EXCLUDED', 'NON_EXISTENT_IN_BANK', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'LOCKED', 'RETIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."status-suppliers" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."supplier_invoices_payment_enum" AS ENUM('CASH', 'CREDIT');--> statement-breakpoint
CREATE TYPE "public"."supplier_transactions_type_enum" AS ENUM('PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADVANCE');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'REVERSED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'ADJUSTED');--> statement-breakpoint
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
	"debit" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"credit" numeric(20, 6) DEFAULT '0.00' NOT NULL,
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
CREATE TABLE "accounts_payable"."accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_invoice_id" integer NOT NULL,
	"original_amount" numeric(18, 2) NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"remaining_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"status" "payment_accounts_payable_enum" DEFAULT 'PENDING' NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "accounts_payable_supplier_invoice_id_unique" UNIQUE("supplier_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "inventory"."fixed_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"asset_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"serial_number" varchar(100),
	"model" varchar(100),
	"brand" varchar(100),
	"acquisition_date" date NOT NULL,
	"purchase_price" numeric(20, 6) NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"asset_status" "fixed_assets_inventory_status" DEFAULT 'ACTIVE' NOT NULL,
	"useful_life_years" integer,
	"depreciation_method" varchar(50),
	"accumulated_depreciation" numeric(20, 6) DEFAULT '0.00',
	"last_depreciation_date" date,
	"disposal_date" date,
	"disposal_reason" text,
	"disposal_value" numeric(18, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "fixed_assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "inventory"."inventories_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"group" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "inventories_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory"."inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"movement_type" "movement_type_inventory" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 2),
	"document_type" varchar(50),
	"document_number" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "inventory"."product_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"supplier_id" integer,
	"price_type" "price_type_enum" NOT NULL,
	"price" numeric(18, 2) NOT NULL,
	"start_date" date DEFAULT now(),
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "inventory"."product_service_suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"service_id" integer,
	"supplier_id" integer NOT NULL,
	"lead_time_days" integer DEFAULT 0,
	"preferred" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "inventory"."products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"brand" varchar(100),
	"model" varchar(100),
	"stock_min" integer DEFAULT 0 NOT NULL,
	"stock_max" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"stock_committed" integer DEFAULT 0 NOT NULL,
	"stock_on_order" integer DEFAULT 0 NOT NULL,
	"status" "product-status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"line_type" "purchase_order_type_enum" NOT NULL,
	"product_id" integer,
	"fixed_asset_id" integer,
	"expense_account_id" integer,
	"description" varchar(255) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"total_cost" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"order_type" "purchase_order_type_enum" NOT NULL,
	"status" "purchase_order_status_enum" DEFAULT 'PENDING' NOT NULL,
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"subtotal" numeric(18, 2) NOT NULL,
	"tax_amount" numeric(18, 2) DEFAULT '0.00',
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "inventory"."services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"supplier_id" integer NOT NULL,
	"default_cost" numeric(18, 2) NOT NULL,
	"status" "status-suppliers" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."supplier_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"line_type" "purchase_order_type_enum" NOT NULL,
	"product_id" integer,
	"fixed_asset_id" integer,
	"expense_account_id" integer,
	"description" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"total_line" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."supplier_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"purchase_order_id" integer,
	"invoice_number" varchar(100) NOT NULL,
	"control_number" varchar(100),
	"invoice_date" date NOT NULL,
	"due_date" date,
	"subtotal" numeric(18, 2) NOT NULL,
	"tax_amount" numeric(18, 2) DEFAULT '0.00',
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"payment_type" "supplier_invoices_payment_enum" DEFAULT 'CREDIT' NOT NULL,
	"status" "invoice_supplier_status_enum" DEFAULT 'OPEN' NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."supplier_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"accounts_payable_id" integer NOT NULL,
	"transaction_type" "supplier_transactions_type_enum" NOT NULL,
	"transaction_date" date NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"payment_method" "payment_method_enum",
	"reference" varchar(255),
	"status" varchar DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"state" integer,
	"address" text,
	"category" "category-suppliers" NOT NULL,
	"status" "status-suppliers" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code"),
	CONSTRAINT "suppliers_tax_id_unique" UNIQUE("tax_id")
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
	"current_balance" numeric(20, 6) DEFAULT '0.00',
	"last_statement_balance" numeric(20, 6),
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
	"adjustment_amount" numeric(20, 6),
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
	"statement_ending_balance" numeric(20, 6) NOT NULL,
	"book_balance_before" numeric(20, 6) NOT NULL,
	"book_balance_after" numeric(20, 6),
	"difference" numeric(20, 6),
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
	"bank_transaction_category" "bank_transaction_category",
	"bank_reference" varchar(100),
	"debit_amount" numeric(20, 6) DEFAULT '0.00',
	"credit_amount" numeric(20, 6) DEFAULT '0.00',
	"resulting_balance" numeric(20, 6),
	"reconciliation_status" "reconciliation_item_status_enum" DEFAULT 'PENDING' NOT NULL,
	"bank_reconciliation_id" integer,
	"upload_batch_id" text,
	"uploaded_at" timestamp DEFAULT now(),
	"internal_link_status" "internal_link_status" DEFAULT 'UNLINKED' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "banking"."internal_transaction_bank_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_transaction_id" integer NOT NULL,
	"internal_record_type" varchar(50) NOT NULL,
	"internal_record_id" integer NOT NULL,
	"linked_at" timestamp DEFAULT now(),
	"linked_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "internal_transaction_bank_links_bank_transaction_id_unique" UNIQUE("bank_transaction_id")
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
	"rate" numeric(20, 6) NOT NULL,
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
	"balance" numeric(20, 6) NOT NULL,
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
	"amount" numeric(20, 6) NOT NULL,
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
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."associate_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"associated_id" integer,
	"account_number" varchar(20) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
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
	"base_salary" numeric(20, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "associates_cedula_unique" UNIQUE("cedula")
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."credit_amortization_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(20, 6) NOT NULL,
	"interest_amount" numeric(20, 6) NOT NULL,
	"total_installment_amount" numeric(20, 6) NOT NULL,
	"principal_balance_pending" numeric(20, 6) NOT NULL,
	"payment_status" "payment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"paid_amount" numeric(20, 6) DEFAULT '0.00',
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
	"amount" numeric(20, 6) NOT NULL,
	"balance_pending" numeric(20, 6) NOT NULL,
	"bank_id" integer,
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
	"amount" numeric(20, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."credit_product_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"agreed_selling_price" numeric(20, 6) NOT NULL,
	"sale_date" date DEFAULT now() NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'ENTREGADO' NOT NULL,
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
	"requested_amount" numeric(20, 6) NOT NULL,
	"start_date" date,
	"end_date" date,
	"total_interest" numeric(20, 6),
	"Installment_amount" numeric(20, 6),
	"total_payable" numeric(20, 6),
	"expenses_amount" numeric(20, 6),
	"overdraft_amount" numeric(20, 6),
	"previous_credit_id" integer,
	"status" "credit_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" integer,
	"notes" text,
	"custom_reference" varchar(50),
	"currency_code" "currency_code_enum",
	"exchange_rate_id" integer,
	"balance_in_favor" numeric(20, 6),
	"commercial_house_id" integer,
	"invoice_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
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
	"max_credit_amount" numeric(20, 6),
	"min_credit_amount" numeric(20, 6),
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
CREATE TABLE "savings_banks"."liquidations_associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_id" integer NOT NULL,
	"liquidation_date" date DEFAULT now() NOT NULL,
	"effective_date" date,
	"currency_code" "currency_code_enum" NOT NULL,
	"total_savings_balance_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_loans_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_credits_at_liquidation" numeric(18, 4) NOT NULL,
	"net_liquidation_amount" numeric(18, 4) NOT NULL,
	"status" "liquidations_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"payout_transaction_id" integer,
	"custom_reference" varchar(50),
	"beneficiary" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_amortization_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(20, 6) NOT NULL,
	"interest_amount" numeric(20, 6) NOT NULL,
	"total_installment_amount" numeric(20, 6) NOT NULL,
	"principal_balance_pending" numeric(20, 6) NOT NULL,
	"payment_status" "payment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"paid_amount" numeric(20, 6) DEFAULT '0.00',
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
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment-type" "loan_payment_type_enum" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"balance_pending" numeric(18, 2) NOT NULL,
	"bank_id" integer,
	"payment_method" "payment_method_enum" NOT NULL,
	"transaction_reference" text,
	"payment_status" "payment_status" DEFAULT 'DONE' NOT NULL,
	"comment" text,
	"custom_reference" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."loan_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_payment_id" integer NOT NULL,
	"installment_id" integer,
	"amount" numeric(20, 6) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'DONE' NOT NULL,
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
	"max_loan_amount" numeric(20, 6),
	"min_loan_amount" numeric(20, 6),
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
	"loan_modality" "loan_modality_type_enum" NOT NULL,
	"request_date" date DEFAULT now() NOT NULL,
	"approval_date" date,
	"disbursement_date" date,
	"requested_amount" numeric(20, 6) NOT NULL,
	"approved_amount" numeric(20, 6),
	"disbursed_amount" numeric(20, 6),
	"start_date" date,
	"end_date" date,
	"total_interest" numeric(20, 6),
	"Installment_amount" numeric(20, 6),
	"total_payable" numeric(20, 6),
	"expenses_amount" numeric(20, 6),
	"overdraft_amount" numeric(20, 6),
	"previous_loan_id" integer,
	"payment_method" "payment_method_enum",
	"disbursement_account_id" integer,
	"status" "loan_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" integer,
	"disbursed_by_user_id" integer,
	"notes" text,
	"custom_reference" varchar(50),
	"currency_code" "currency_code_enum",
	"exchange_rate_id" integer,
	"balance_in_favor" numeric(20, 6),
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
	"requested_amount" numeric(20, 6) NOT NULL,
	"administrative_fee" numeric(20, 6) DEFAULT '0.00',
	"disbursed_amount" numeric(20, 6),
	"payment_method" "payment_method_enum",
	"reference_code" varchar(100),
	"status" "withdrawal_status_enum" DEFAULT 'REQUESTED' NOT NULL,
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
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "accounts_payable"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ADD CONSTRAINT "fixed_assets_category_id_inventories_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "inventory"."inventories_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ADD CONSTRAINT "fixed_assets_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ADD CONSTRAINT "fixed_assets_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventories_categories" ADD CONSTRAINT "inventories_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventories_categories" ADD CONSTRAINT "inventories_categories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD CONSTRAINT "inventory_movements_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "inventory"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_category_id_inventories_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "inventory"."inventories_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "accounts_payable"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_fixed_asset_id_fixed_assets_id_fk" FOREIGN KEY ("fixed_asset_id") REFERENCES "inventory"."fixed_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_expense_account_id_account_plan_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."services" ADD CONSTRAINT "services_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."services" ADD CONSTRAINT "services_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."services" ADD CONSTRAINT "services_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "accounts_payable"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_fixed_asset_id_fixed_assets_id_fk" FOREIGN KEY ("fixed_asset_id") REFERENCES "inventory"."fixed_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "accounts_payable"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_accounts_payable_id_accounts_payable_id_fk" FOREIGN KEY ("accounts_payable_id") REFERENCES "accounts_payable"."accounts_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_state_states_id_fk" FOREIGN KEY ("state") REFERENCES "core"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "banking"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "banking"."bank_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_linked_by_users_id_fk" FOREIGN KEY ("linked_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "savings_banks"."credit_product_sales" ADD CONSTRAINT "credit_product_sales_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_product_sales" ADD CONSTRAINT "credit_product_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_product_sales" ADD CONSTRAINT "credit_product_sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_product_sales" ADD CONSTRAINT "credit_product_sales_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_credit_account_chart_id_account_plan_id_fk" FOREIGN KEY ("credit_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_interest_earned_account_chart_id_account_plan_id_fk" FOREIGN KEY ("interest_earned_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_special_quota_account_chart_id_account_plan_id_fk" FOREIGN KEY ("special_quota_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_expense_account_chart_id_account_plan_id_fk" FOREIGN KEY ("expense_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_payroll_type_id_category_types_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."category_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings_banks"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "banking"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD CONSTRAINT "loan_payments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_loan_payment_id_loan_payments_id_fk" FOREIGN KEY ("loan_payment_id") REFERENCES "savings_banks"."loan_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_installment_id_loan_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings_banks"."loan_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "savings_banks"."loans" ADD CONSTRAINT "loans_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
CREATE UNIQUE INDEX "payable_invoice_uidx" ON "accounts_payable"."accounts_payable" USING btree ("supplier_invoice_id");--> statement-breakpoint
CREATE INDEX "ap_status_idx" ON "accounts_payable"."accounts_payable" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fixed_asset_code_idx" ON "inventory"."fixed_assets" USING btree ("asset_code");--> statement-breakpoint
CREATE INDEX "fixed_asset_cat_id_idx" ON "inventory"."fixed_assets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "fixed_asset_status_idx" ON "inventory"."fixed_assets" USING btree ("asset_status");--> statement-breakpoint
CREATE INDEX "inventory_categories_name_idx" ON "inventory"."inventories_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "inventory_categories_group_idx" ON "inventory"."inventories_categories" USING btree ("group");--> statement-breakpoint
CREATE INDEX "product_idx" ON "inventory"."product_service_suppliers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "service_idx" ON "inventory"."product_service_suppliers" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "supplier_idx" ON "inventory"."product_service_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "sales_prod_sku_idx" ON "inventory"."products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "sales_prod_name_idx" ON "inventory"."products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "sales_prod_cat_id_idx" ON "inventory"."products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "po_order_number_idx" ON "accounts_payable"."purchase_orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "si_invoice_unique_idx" ON "accounts_payable"."supplier_invoices" USING btree ("supplier_id","invoice_number");--> statement-breakpoint
CREATE INDEX "supplier_name_idx" ON "accounts_payable"."suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "supplier_tax_idx" ON "accounts_payable"."suppliers" USING btree ("tax_id");--> statement-breakpoint
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
CREATE INDEX "int_trans_links_bank_trans_id_idx" ON "banking"."internal_transaction_bank_links" USING btree ("bank_transaction_id");--> statement-breakpoint
CREATE INDEX "int_trans_links_internal_record_idx" ON "banking"."internal_transaction_bank_links" USING btree ("internal_record_type","internal_record_id");--> statement-breakpoint
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
CREATE UNIQUE INDEX "credit_amort_credit_installment_uidx" ON "savings_banks"."credit_amortization_schedule" USING btree ("credit_id","installment_number");--> statement-breakpoint
CREATE INDEX "credit_amort_due_date_status_idx" ON "savings_banks"."credit_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_payments_uidx" ON "savings_banks"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_date_idx" ON "savings_banks"."credit_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "credit_payments_reference_idx" ON "savings_banks"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_transaction_reference_idx" ON "savings_banks"."credit_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_details_installment_idx" ON "savings_banks"."credit_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "credit_prod_sale_credit_id_idx" ON "savings_banks"."credit_product_sales" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "credit_prod_sale_prod_id_idx" ON "savings_banks"."credit_product_sales" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "credit_status_history_idx" ON "savings_banks"."credit_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_associate_idx" ON "savings_banks"."credits" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "credit_status_date_idx" ON "savings_banks"."credits" USING btree ("status","request_date");--> statement-breakpoint
CREATE INDEX "credits_types_name_idx" ON "savings_banks"."credits_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "credits_types_credit_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("credit_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_interest_earned_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("interest_earned_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_special_quota_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("special_quota_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_expense_account_chart_id_idx" ON "savings_banks"."credits_types" USING btree ("expense_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_payroll_type_id_idx" ON "savings_banks"."credits_types" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "liquidations_associate_liquidation_uidx" ON "savings_banks"."liquidations_associates" USING btree ("associate_id","liquidation_date");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_amort_loan_installment_uidx" ON "savings_banks"."loan_amortization_schedule" USING btree ("loan_id","installment_number");--> statement-breakpoint
CREATE INDEX "loan_amort_due_date_status_idx" ON "savings_banks"."loan_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_payments_uidx" ON "savings_banks"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_date_idx" ON "savings_banks"."loan_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "loan_payments_reference_idx" ON "savings_banks"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_transaction_reference_idx" ON "savings_banks"."loan_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_details_installment_idx" ON "savings_banks"."loan_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "loan_status_history_idx" ON "savings_banks"."loan_status_history" USING btree ("status");--> statement-breakpoint
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
CREATE UNIQUE INDEX "withdrawals_reference_code_uidx" ON "savings_banks"."withdrawals_associates" USING btree ("reference_code");--> statement-breakpoint
CREATE VIEW "savings_banks"."associate_account_balances" AS (
    SELECT
      aa.id AS associate_account_id,
      aa.associated_id,
      aa.account_number,
      aa.currency_code,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
            'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
            'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
            'LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_PARTIAL_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
            'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
            'OTHER_CREDIT'::public.associate_movement_type_enum
          ]) THEN aam.amount
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_DEBIT'::public.associate_movement_type_enum,
            'LOAN_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_INTEREST_DEBIT'::public.associate_movement_type_enum,
            'LOAN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LATE_PAYMENT_FEE_DEBIT'::public.associate_movement_type_enum,
            'PAYMENT_REVERSAL_DEBIT'::public.associate_movement_type_enum,
            'CREDIT_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
            'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
            'ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'OTHER_DEBIT'::public.associate_movement_type_enum,
            'FEE_DEBIT'::public.associate_movement_type_enum
          ]) THEN - aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM
      "savings_banks"."associate_accounts" aa
    LEFT JOIN
      "savings_banks"."associate_account_movements" aam ON aa.id = aam.associate_account_id
    GROUP BY
      aa.id, aa.associated_id, aa.account_number, aa.currency_code
  );--> statement-breakpoint
CREATE VIEW "savings_banks"."associate_haberes_balance" AS (
  SELECT
      "savings_banks"."associate_account_movements"."associate_account_id",
      -- Saldo total de haberes (la suma y resta de todos los movimientos que componen el haber)
      SUM(
          CASE
              -- Movimientos que SUMAN al Haber Patrimonial (Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" = ANY (ARRAY[
                  'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
                  'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
                  'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
                  'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
                  'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
                  'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
                  'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'SAVING_WITHDRAWAL_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_CREDIT'::associate_movement_type_enum,
                  'OTHER_CREDIT'::associate_movement_type_enum
              ]) THEN "savings_banks"."associate_account_movements"."amount"
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" = ANY (ARRAY[
                  'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
                  'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
                  'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
                  'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
                  'PAYMENT_REVERSAL_DEBIT'::associate_movement_type_enum, -- Aunque es "PAYMENT", podría ser una reversión de pago de algo no crediticio
                  'ADMIN_FEE_DEBIT'::associate_movement_type_enum,
                  'OTHER_DEBIT'::associate_movement_type_enum,
                  'FEE_DEBIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_DEBIT'::associate_movement_type_enum
              ]) THEN -"savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ) AS haberes_balance,
      MAX("savings_banks"."associate_account_movements"."transaction_date") AS last_movement_date,

      -- --- Columnas de desglose ---
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'SAVING_CONTRIBUTION'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_contribution,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_voluntary,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_employer,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'DIVIDEND_CREDIT'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS surpluses,
      -- Nueva columna para la suma de todos los retiros
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'SAVING_WITHDRAWAL'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS total_withdrawals,
      -- Nueva columna para la suma de todos los gastos administrativos por retiros
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS total_withdrawal_fees
  FROM
      "savings_banks"."associate_account_movements"
  GROUP BY
      "savings_banks"."associate_account_movements"."associate_account_id"
);--> statement-breakpoint
CREATE VIEW "savings_banks"."credit_outstanding_balance" AS (
  SELECT
      c.id AS credit_id,
      c.associate_id,
      c.currency_code,
      c.status AS credit_status,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.principal_amount ELSE 0 END) AS total_principal_pending,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.interest_amount ELSE 0 END) AS total_interest_pending,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.principal_amount ELSE 0 END) +
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.interest_amount ELSE 0 END) AS outstanding_total_balance
  FROM
      "savings_banks"."credits" c
  JOIN
      "savings_banks"."credit_amortization_schedule" cas ON c.id = cas.credit_id
  WHERE
      c.status IN ('APPROVED'::credit_status_enum, 'IN_PAYMENT'::credit_status_enum)
  GROUP BY
      c.id,
      c.associate_id,
      c.currency_code,
      c.status
);--> statement-breakpoint
CREATE VIEW "savings_banks"."loan_outstanding_balance" AS (
  SELECT
      l.id AS loan_id,
      l.associate_id,
      l.currency_code,
      l.status AS loan_status,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) AS total_principal_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS total_interest_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) +
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS outstanding_total_balance
  FROM
      "savings_banks"."loans" l
  JOIN
      "savings_banks"."loan_amortization_schedule" las ON l.id = las.loan_id
  WHERE
      l.status IN ('DISBURSED'::loan_status_enum, 'IN_PAYMENT'::loan_status_enum, 'OVERDUE'::loan_status_enum)
  GROUP BY
      l.id,
      l.associate_id,
      l.currency_code,
      l.status
);