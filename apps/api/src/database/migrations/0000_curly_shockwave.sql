CREATE SCHEMA "accounting";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "inventory";
--> statement-breakpoint
CREATE SCHEMA "purchasing";
--> statement-breakpoint
CREATE SCHEMA "savings";
--> statement-breakpoint
CREATE SCHEMA "tenant";
--> statement-breakpoint
CREATE SCHEMA "treasury";
--> statement-breakpoint
CREATE TYPE "accounting"."account_nature" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "accounting"."account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'MEMORANDUM');--> statement-breakpoint
CREATE TYPE "accounting"."cycle_status" AS ENUM('OPEN', 'CLOSED', 'CLOSING', 'PENDING');--> statement-breakpoint
CREATE TYPE "accounting"."accounting_entry_status" AS ENUM('DRAFT', 'PENDING', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "audit"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'refresh', 'export', 'import');--> statement-breakpoint
CREATE TYPE "audit"."audit_target_type" AS ENUM('user', 'role', 'permission', 'session', 'associate', 'tenant', 'category', 'account', 'transaction', 'report', 'settings');--> statement-breakpoint
CREATE TYPE "audit"."severity_level" AS ENUM('debug', 'info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TYPE "audit"."system_event_type" AS ENUM('database_error', 'validation_error', 'authentication_failed', 'authorization_failed', 'rate_limit_exceeded', 'internal_server_error', 'external_api_error', 'cron_job_failed', 'backup_failed');--> statement-breakpoint
CREATE TYPE "inventory"."fixed_assets_inventory_status" AS ENUM('ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE', 'DEREGISTERED');--> statement-breakpoint
CREATE TYPE "inventory"."invoice_type_enum" AS ENUM('EXPENSE', 'PURCHASE');--> statement-breakpoint
CREATE TYPE "inventory"."movement_type_inventory" AS ENUM('IN', 'OUT', 'ADJUST_IN', 'ADJUST_OUT', 'TRANSFER', 'COMMIT', 'UN_COMMIT', 'ORDERED', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "inventory"."price_type" AS ENUM('COST', 'SELLING', 'OFFER');--> statement-breakpoint
CREATE TYPE "inventory"."product_status" AS ENUM('AVAILABLE', 'DISABLED', 'OUT_OF_STOCK', 'COMMING_SOON', 'ON_SALE');--> statement-breakpoint
CREATE TYPE "inventory"."unit_of_measure" AS ENUM('UNIT', 'KILOGRAM', 'LITER', 'METER', 'BOX', 'PACK');--> statement-breakpoint
CREATE TYPE "auth"."permission_action" AS ENUM('read', 'create', 'update', 'delete', 'execute', 'approve', 'reject', 'process', 'disburse', 'mass_upload', 'mass_disburse');--> statement-breakpoint
CREATE TYPE "auth"."permission_resource" AS ENUM('savings:members', 'savings:contributions', 'savings:withdrawals', 'savings:liquidations', 'savings:configuration', 'portfolio:loans', 'portfolio:credits', 'portfolio:payments', 'portfolio:products', 'accounting:chart_of_accounts', 'accounting:rules', 'accounting:journal_entries', 'accounting:reports', 'accounting:cycles', 'accounting:balances', 'banking:directory', 'banking:accounts', 'banking:transactions', 'banking:reconciliation', 'inventory:products', 'inventory:services', 'inventory:assets', 'inventory:stock', 'purchasing:orders', 'purchasing:providers', 'purchasing:invoices', 'purchasing:payments', 'purchasing:reports', 'purchasing:accounts_payable', 'iam:users', 'iam:roles', 'iam:permissions', 'iam:sessions', 'catalog:currencies', 'catalog:exchange_rates', 'catalog:categories', 'catalog:geography', 'system:tenants', 'system:tenants-systems', 'system:global', 'system:currencies', 'system:modules');--> statement-breakpoint
CREATE TYPE "auth"."permission_scope" AS ENUM('all', 'team', 'department', 'branch', 'tenant', 'global', 'own');--> statement-breakpoint
CREATE TYPE "purchasing"."category_suppliers" AS ENUM('ASSETS', 'SERVICE', 'PRODUCTS', 'MATERIALS', 'FURNITURE', 'OTHERS');--> statement-breakpoint
CREATE TYPE "purchasing"."invoice_suppliers_status" AS ENUM('DRAFT', 'PENDING', 'ACCOUNTED_FOR', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "purchasing"."payment_accounts_payable" AS ENUM('PENDING', 'IN_PROGRESS', 'PAID', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "purchasing"."payment_supplier_status" AS ENUM('DRAFT', 'PENDING', 'SENT_TO_BANK', 'PROCESSED', 'REJECTED', 'CANCELLED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "purchasing"."purchase_order_status" AS ENUM('DRAFT', 'PENDING', 'RECEIVED', 'INVOICED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "purchasing"."purchase_order_type" AS ENUM('SALES_INVENTORY', 'FIXED_ASSET', 'SERVICE', 'EXPENSE', 'SERVICE_EXPENSE');--> statement-breakpoint
CREATE TYPE "purchasing"."status_suppliers" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "purchasing"."supplier_invoices_payment" AS ENUM('CASH', 'CREDIT');--> statement-breakpoint
CREATE TYPE "purchasing"."supplier_transactions_type" AS ENUM('PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADVANCE');--> statement-breakpoint
CREATE TYPE "savings"."associate_movement_type" AS ENUM('SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'VOLUNTARY_SAVINGS', 'SAVING_WITHDRAWAL', 'LOAN_DISBURSEMENT_CREDIT', 'SPECIAL_LOAN_DISBURSEMENT_CREDIT', 'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT', 'SPECIAL_CREDIT_DISBURSEMENT_CREDIT', 'LOAN_REFINANCING_DEBIT', 'LOAN_REFINANCING_CREDIT', 'LOAN_PAYMENT_DEBIT', 'COMMERCIAL_CREDIT_PAYMENT_DEBIT', 'LOAN_REIMBURSEMENT_CREDIT', 'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT', 'LOAN_OVERPAYMENT_CREDIT', 'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT', 'LOAN_PARTIAL_DISBURSEMENT_CREDIT', 'WITHDRAWAL_FEE_DEBIT', 'LOAN_INTEREST_DEBIT', 'LOAN_FEE_DEBIT', 'LOAN_ADMIN_FEE_DEBIT', 'LATE_PAYMENT_FEE_DEBIT', 'PAYMENT_REVERSAL_DEBIT', 'CREDIT_ADMIN_FEE_DEBIT', 'DIVIDEND_CREDIT', 'FEE_REIMBURSEMENT_CREDIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'FEE_CORRECTION_DEBIT', 'ADMIN_FEE_DEBIT', 'OTHER_DEBIT', 'FEE_DEBIT', 'OTHER_CREDIT', 'LIQUIDATION_BALANCE', 'LOAN_DISBURSEMENT_REVERSAL_DEBIT', 'SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT', 'COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', 'SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', 'LOAN_PAYMENT_REVERSAL_CREDIT', 'COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT', 'SAVING_WITHDRAWAL_REVERSAL_CREDIT', 'LIQUIDATION_BALANCE_REVERSAL_CREDIT', 'ACCOUNTING_ADJUSTMENT_DEBIT', 'ACCOUNTING_ADJUSTMENT_CREDIT', 'LIQUIDATION_LOAN_PAYMENT_DEBIT', 'LIQUIDATION_CREDIT_PAYMENT_DEBIT', 'LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT', 'LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT', 'LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT');--> statement-breakpoint
CREATE TYPE "savings"."credit_modality_type" AS ENUM('ORDINARY', 'SPECIAL_QUOTAS');--> statement-breakpoint
CREATE TYPE "savings"."credit_payment_type" AS ENUM('PAYING', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "savings"."credit_status" AS ENUM('REQUESTED', 'APPROVED', 'IN_PAYMENT', 'PAID');--> statement-breakpoint
CREATE TYPE "savings"."liquidations_status" AS ENUM('REQUESTED', 'PROCESSED', 'REJECTED', 'REVERSED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "savings"."loan_modality_type" AS ENUM('ORDINARY', 'SPECIAL_QUOTAS');--> statement-breakpoint
CREATE TYPE "savings"."loan_payment_type" AS ENUM('PAYING', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "savings"."loan_status" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'IN_PAYMENT', 'PAID', 'OVERDUE', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "savings"."movement_status" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REVERSED', 'DONE');--> statement-breakpoint
CREATE TYPE "savings"."payment_batch_item_type" AS ENUM('LOAN', 'WITHDRAWAL', 'LIQUIDATION');--> statement-breakpoint
CREATE TYPE "savings"."payment_batch_status" AS ENUM('DRAFT', 'UPLOADED', 'PROCESSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "savings"."payment_status" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELED', 'DONE');--> statement-breakpoint
CREATE TYPE "savings"."withdrawal_status" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'REVERSED', 'CANCELLED', 'PENDING_DISBURSEMENT_BANK_BATCH', 'DISBURSED', 'PROCESSED', 'DISBURSEMENT_FAILED', 'DISBURSED_REVERSED', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('VES', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('FEMENINO', 'MASCULINO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."nationality" AS ENUM('VENEZOLANO', 'EXTRANJERO');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'BANK_TRANSFER', 'CHECK', 'DEPOSIT', 'OTHER', 'MOBILE_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'LOCKED', 'RETIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "treasury"."bank_transaction_category" AS ENUM('MEMBER_CONTRIBUTION', 'MEMBER_WITHDRAWAL', 'PAYROLL_SETTLEMENT', 'LOAN_DISBURSEMENT', 'LOAN_PAYMENT', 'CREDIT_DISBURSEMENT', 'CREDIT_PAYMENT', 'BATCH_DISBURSEMENT', 'SUPPLIER_PAYMENT', 'SUPPLIER_ADVANCE_PAYMENT', 'INTERNAL_TRANSFER', 'BANK_FEE', 'INTEREST_EARNED', 'INTEREST_CHARGED', 'BANK_ADJUSTMENT', 'TAX_DEBIT', 'TAX_CREDIT', 'OTHER_INCOME', 'OTHER_EXPENSE', 'OPENING_BANK', 'CLOSING_BANK');--> statement-breakpoint
CREATE TYPE "treasury"."internal_link_status" AS ENUM('LINKED', 'UNLINKED', 'PARTIALLY_LINKED', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TYPE "treasury"."reconciliation_item_status" AS ENUM('PENDING', 'RECONCILED', 'MANUAL_MATCH', 'ADJUSTMENT', 'EXCLUDED', 'NON_EXISTENT_IN_BANK', 'VOIDED');--> statement-breakpoint
CREATE TYPE "treasury"."reconciliation_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');--> statement-breakpoint
CREATE TABLE "accounting"."account_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_plan_id" uuid NOT NULL,
	"accounting_cycles_id" uuid NOT NULL,
	"initial_balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"debit_balance" numeric(20, 6) DEFAULT '0',
	"credit_balance" numeric(20, 6) DEFAULT '0',
	"final_balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "account_balances_unique" UNIQUE("tenant_id","account_plan_id","accounting_cycles_id")
);
--> statement-breakpoint
CREATE TABLE "accounting"."account_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"account_type" "accounting"."account_type" NOT NULL,
	"nature" "accounting"."account_nature" NOT NULL,
	"level" integer NOT NULL,
	"allows_movements" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true,
	"parent_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "accounting"."cycle_status" DEFAULT 'OPEN' NOT NULL,
	"description" text NOT NULL,
	"closed_by_user_id" uuid,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"accounting_cycle_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"description" text NOT NULL,
	"voucher_no" integer NOT NULL,
	"origin_reference_id" text,
	"origin_type" varchar(50),
	"status" "accounting"."accounting_entry_status" DEFAULT 'DRAFT' NOT NULL,
	"posted_at" timestamp,
	"currency_code" "currency_code" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_entry_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accounting_entry_id" uuid NOT NULL,
	"account_plan_id" uuid NOT NULL,
	"associate_id" uuid,
	"supplier_id" uuid,
	"debit" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"credit" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "debit_credit_check" CHECK (("accounting"."accounting_entry_details"."debit" > 0 AND "accounting"."accounting_entry_details"."credit" = 0) OR ("accounting"."accounting_entry_details"."debit" = 0 AND "accounting"."accounting_entry_details"."credit" > 0) OR ("accounting"."accounting_entry_details"."debit" = 0 AND "accounting"."accounting_entry_details"."credit" = 0)),
	CONSTRAINT "amount_positive_check" CHECK ("accounting"."accounting_entry_details"."debit" >= 0 AND "accounting"."accounting_entry_details"."credit" >= 0),
	CONSTRAINT "only_one_auxiliary_check" CHECK (("accounting"."accounting_entry_details"."associate_id" IS NULL OR "accounting"."accounting_entry_details"."supplier_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_rule_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid,
	"account_role" varchar,
	"movement_type" varchar NOT NULL,
	"is_auxiliary" boolean DEFAULT false,
	"is_auxiliary_supplier" boolean DEFAULT false,
	"formula" text,
	"account_plan_id" uuid
);
--> statement-breakpoint
CREATE TABLE "accounting"."accounting_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) DEFAULT 'ACCOUNTING' NOT NULL,
	"operation_type" varchar NOT NULL,
	"reference_value" varchar(255),
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."accounts_payable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid,
	"supplier_invoice_id" uuid,
	"ap_number" varchar(50) NOT NULL,
	"original_amount" numeric(18, 2) NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"remaining_amount" numeric(18, 2) NOT NULL,
	"due_date" date,
	"currency_code" "currency_code" NOT NULL,
	"status" "purchasing"."payment_accounts_payable" DEFAULT 'PENDING' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL',
	"is_authorize_payment" boolean DEFAULT false,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "accounts_payable_supplier_invoice_id_unique" UNIQUE("supplier_invoice_id"),
	CONSTRAINT "accounts_payable_ap_number_unique" UNIQUE("ap_number")
);
--> statement-breakpoint
CREATE TABLE "savings"."associate_account_balance_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"associate_account_id" uuid NOT NULL,
	"balance_date" timestamp DEFAULT now() NOT NULL,
	"balance" numeric(20, 6) NOT NULL,
	"movement_id" uuid,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."associate_account_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"associate_account_id" uuid NOT NULL,
	"movement_type" "savings"."associate_movement_type" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"reference_id" text,
	"reference_type" varchar(50),
	"reference_number" varchar(20),
	"exchange_rate_id" uuid,
	"status" "savings"."movement_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."associate_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"associate_id" uuid,
	"account_number" varchar(20) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"balance" numeric(20, 6) DEFAULT '0.00' NOT NULL,
	"opening_date" date DEFAULT now(),
	"closing_date" date,
	"bank_id" uuid,
	"status" "status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "associate_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "savings"."associates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cedula" varchar(20) NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"nationality" "nationality" NOT NULL,
	"gender" "gender",
	"birthdate" date,
	"admission_date" date NOT NULL,
	"graduation_date" date,
	"discount_frequency_id" integer,
	"status" "status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"is_payroll_credit" boolean DEFAULT false NOT NULL,
	"locality_id" integer,
	"phone" varchar(50),
	"email" varchar(100),
	"payroll_type_id" uuid,
	"associated_type_id" uuid,
	"job_title" text,
	"base_salary" numeric(20, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "associates_cedula_unique" UNIQUE("cedula")
);
--> statement-breakpoint
CREATE TABLE "audit"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"correlation_id" uuid,
	"action" "audit"."audit_action" NOT NULL,
	"target_type" "audit"."audit_target_type" NOT NULL,
	"target_id" text,
	"target_cedula" varchar(20),
	"changes" jsonb,
	"previous_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" text,
	"geo_location" jsonb,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_directory_id" uuid NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(255),
	"account_type" varchar(50) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"opening_date" date,
	"current_balance" numeric(20, 6) DEFAULT '0.00',
	"last_statement_balance" numeric(20, 6),
	"last_statement_date" date,
	"linked_chart_account_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"opening_entry_posted" boolean DEFAULT false,
	"rule_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "bank_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_category_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" "treasury"."bank_transaction_category" NOT NULL,
	"internal_table" varchar(50),
	"record_status" varchar(20),
	"direction" char(1) NOT NULL,
	"default_debit_account_id" uuid,
	"default_credit_account_id" uuid,
	"auto_list" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	"country_code" varchar(3) DEFAULT 'VEN',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "bank_directory_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_reconciliation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_reconciliation_id" uuid NOT NULL,
	"bank_transaction_id" uuid,
	"accounting_entry_detail_id" uuid,
	"adjustment_type" varchar(50),
	"adjustment_amount" numeric(20, 6),
	"description" text,
	"is_book_adjustment" boolean DEFAULT false,
	"adjustment_entry_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "bank_reconciliation_details_bank_transaction_id_unique" UNIQUE("bank_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"statement_date" date NOT NULL,
	"statement_ending_balance" numeric(20, 6) NOT NULL,
	"book_balance_before" numeric(20, 6) NOT NULL,
	"book_balance_after" numeric(20, 6),
	"difference" numeric(20, 6),
	"reconciliation_date" timestamp DEFAULT now(),
	"status" "treasury"."reconciliation_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"prepared_by_user_id" uuid,
	"reviewed_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "treasury"."bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_date" date NOT NULL,
	"value_date" date,
	"description" text NOT NULL,
	"bank_transaction_category" "treasury"."bank_transaction_category" NOT NULL,
	"bank_reference" varchar(100),
	"debit_amount" numeric(20, 6) DEFAULT '0.00',
	"credit_amount" numeric(20, 6) DEFAULT '0.00',
	"resulting_balance" numeric(20, 6),
	"reconciliation_status" "treasury"."reconciliation_item_status" DEFAULT 'PENDING' NOT NULL,
	"bank_reconciliation_id" uuid,
	"upload_batch_id" text,
	"uploaded_at" timestamp DEFAULT now(),
	"accounting_entry_id" uuid,
	"internal_link_status" "treasury"."internal_link_status" DEFAULT 'UNLINKED' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"options" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credit_amortization_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(20, 6) NOT NULL,
	"interest_amount" numeric(20, 6) NOT NULL,
	"total_installment_amount" numeric(20, 6) NOT NULL,
	"principal_balance_pending" numeric(20, 6) NOT NULL,
	"payment_status" "savings"."payment_status" DEFAULT 'PENDING' NOT NULL,
	"paid_amount" numeric(20, 6) DEFAULT '0.00',
	"last_payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credit_item_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"item_type" varchar NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"agreed_selling_price" numeric(20, 6) NOT NULL,
	"sale_date" date DEFAULT now() NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'ENTREGADO' NOT NULL,
	"days" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credit_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment-type" "savings"."credit_payment_type" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"balance_pending" numeric(20, 6) NOT NULL,
	"bank_id" uuid,
	"payment_method" "payment_method" NOT NULL,
	"transaction_reference" text,
	"comment" text,
	"custom_reference" varchar(50),
	"payment_status" "savings"."payment_status" DEFAULT 'DONE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credit_payment_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_payment_id" uuid NOT NULL,
	"installment_id" uuid,
	"amount" numeric(20, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credit_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_id" uuid NOT NULL,
	"status" "savings"."credit_status" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_user_id" uuid,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "savings"."credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"credit_type_id" uuid NOT NULL,
	"credit_modality" "savings"."credit_modality_type" NOT NULL,
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
	"previous_credit_id" uuid,
	"status" "savings"."credit_status" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" uuid,
	"notes" text,
	"custom_reference" varchar(50),
	"currency_code" "currency_code",
	"exchange_rate_id" uuid,
	"balance_in_favor" numeric(20, 6),
	"commercial_house_id" uuid,
	"invoice_number" varchar(50),
	"interest_rate" numeric(5, 2),
	"term_type" varchar(20),
	"term_units" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."credits_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"interest_rate" numeric(5, 2) NOT NULL,
	"term_type" varchar(20) NOT NULL,
	"term_units" integer NOT NULL,
	"cancellation_percentage" numeric(5, 2),
	"credit_account_chart_id" uuid,
	"interest_earned_account_chart_id" uuid,
	"special_quota_account_chart_id" uuid,
	"expense_account_chart_id" uuid,
	"special_quota_number" integer DEFAULT 0,
	"special_quota_percentage" numeric(5, 2) DEFAULT '0',
	"max_credit_amount" numeric(20, 6),
	"min_credit_amount" numeric(20, 6),
	"payroll_type_id" uuid,
	"administrative_expense_percentage" numeric(5, 2) DEFAULT '0',
	"minimum_seniority_months" integer DEFAULT 0,
	"accepts_debit_balance" boolean DEFAULT false NOT NULL,
	"accepts_guarantors" boolean DEFAULT false NOT NULL,
	"accepts_availability" boolean DEFAULT false NOT NULL,
	"accepts_refinancing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "currency_code" NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(5),
	"decimal_places" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_base" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "core"."exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency_id" uuid NOT NULL,
	"rate" varchar(20) NOT NULL,
	"source" varchar(50) DEFAULT 'MANUAL',
	"is_automatic" boolean DEFAULT false,
	"fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory"."fixed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"asset_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"serial_number" varchar(100),
	"model" varchar(100),
	"brand" varchar(100),
	"acquisition_date" date NOT NULL,
	"asset_status" "inventory"."fixed_assets_inventory_status" DEFAULT 'ACTIVE' NOT NULL,
	"useful_life_years" integer,
	"depreciation_method" varchar(50),
	"accumulated_depreciation" numeric(20, 6) DEFAULT '0.00',
	"last_depreciation_date" date,
	"disposal_date" date,
	"disposal_reason" text,
	"disposal_value" numeric(18, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "fixed_assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "inventory"."fixed_assets_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fixed_assets_id" uuid NOT NULL,
	"supplier_id" uuid,
	"base_cost" numeric(18, 6),
	"other_costs" numeric(18, 6) DEFAULT '0.00',
	"purchase_tax" numeric(18, 6) DEFAULT '0.00',
	"total_cost" numeric(18, 6),
	"supplier_invoice_id" uuid,
	"start_date" date DEFAULT now(),
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."global_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"is_encrypted" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "global_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "treasury"."internal_transaction_bank_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_transaction_id" uuid NOT NULL,
	"internal_record_type" varchar(50) NOT NULL,
	"internal_record_id" integer NOT NULL,
	"linked_at" timestamp DEFAULT now(),
	"linked_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory"."inventories_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "inventories_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory"."inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"description" text,
	"movement_date" date DEFAULT now(),
	"item_id" integer NOT NULL,
	"item_type" varchar NOT NULL,
	"movement_number" varchar(50) NOT NULL,
	"movement_type" "inventory"."movement_type_inventory" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 2),
	"document_type" varchar(50),
	"document_number" varchar(50),
	"supplier_invoice_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."liquidations_associates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"liquidation_date" date DEFAULT now() NOT NULL,
	"effective_date" date,
	"currency_code" "currency_code" NOT NULL,
	"total_savings_balance_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_loans_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_credits_at_liquidation" numeric(18, 4) NOT NULL,
	"net_liquidation_amount" numeric(18, 4) NOT NULL,
	"status" "savings"."liquidations_status" DEFAULT 'REQUESTED' NOT NULL,
	"payout_transaction_id" integer,
	"custom_reference" varchar(50),
	"beneficiary" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."loan_amortization_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(20, 6) NOT NULL,
	"interest_amount" numeric(20, 6) NOT NULL,
	"total_installment_amount" numeric(20, 6) NOT NULL,
	"principal_balance_pending" numeric(20, 6) NOT NULL,
	"payment_status" "savings"."payment_status" DEFAULT 'PENDING' NOT NULL,
	"paid_amount" numeric(20, 6) DEFAULT '0.00',
	"last_payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."loan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"loan_id" uuid NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment-type" "savings"."loan_payment_type" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"balance_pending" numeric(18, 2) NOT NULL,
	"bank_id" uuid,
	"payment_method" "payment_method" NOT NULL,
	"transaction_reference" text,
	"payment_status" "savings"."payment_status" DEFAULT 'DONE' NOT NULL,
	"comment" text,
	"custom_reference" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."loan_payment_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_payment_id" uuid NOT NULL,
	"installment_id" uuid,
	"amount" numeric(20, 6) NOT NULL,
	"payment_status" "savings"."payment_status" DEFAULT 'DONE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."loan_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"status" "savings"."loan_status" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_user_id" uuid,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "savings"."loan_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"interest_rate" numeric(5, 2) NOT NULL,
	"term_type" varchar(20) NOT NULL,
	"term_units" integer NOT NULL,
	"cancellation_percentage" numeric(5, 2),
	"loan_account_chart_id" uuid,
	"interest_earned_account_chart_id" uuid,
	"special_quota_account_chart_id" uuid,
	"expense_account_chart_id" uuid,
	"special_quota_number" integer DEFAULT 0,
	"special_quota_percentage" numeric(5, 2) DEFAULT '0',
	"max_loan_amount" numeric(20, 6),
	"min_loan_amount" numeric(20, 6),
	"payroll_type_id" uuid,
	"administrative_expense_percentage" numeric(5, 2) DEFAULT '0',
	"minimum_seniority_months" integer DEFAULT 0,
	"accepts_debit_balance" boolean DEFAULT false NOT NULL,
	"accepts_guarantors" boolean DEFAULT false NOT NULL,
	"accepts_availability" boolean DEFAULT false NOT NULL,
	"accepts_refinancing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"loan_type_id" uuid NOT NULL,
	"loan_modality" "savings"."loan_modality_type" NOT NULL,
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
	"previous_loan_id" uuid,
	"payment_method" "payment_method",
	"disbursement_account_id" uuid,
	"status" "savings"."loan_status" DEFAULT 'REQUESTED' NOT NULL,
	"rejection_reason" text,
	"approved_by_user_id" uuid,
	"disbursed_by_user_id" uuid,
	"notes" text,
	"custom_reference" varchar(50),
	"currency_code" "currency_code",
	"exchange_rate_id" uuid,
	"balance_in_favor" numeric(20, 6),
	"interest_rate" numeric(5, 2),
	"term_type" varchar(20),
	"term_units" integer,
	"expenses_percentage" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
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
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "localities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "auth"."login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"username" varchar(50) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"device_fingerprint" text,
	"geo_location" jsonb,
	"success" boolean NOT NULL,
	"failure_reason" varchar(100),
	"correlation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."module_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"module" varchar(50) NOT NULL,
	"submodule" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"is_encrypted" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."municipalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."parishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"municipality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."payment_batch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_batch_id" uuid,
	"item_type" "savings"."payment_batch_item_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"associate_account_id" uuid,
	"beneficiary_account_number" varchar(50) NOT NULL,
	"beneficiary_account_type" varchar(20) NOT NULL,
	"beneficiary_id" varchar(20) NOT NULL,
	"beneficiary_name" varchar(150) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."payment_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_batch_reference" varchar(50) NOT NULL,
	"description" varchar(100),
	"status" "savings"."payment_batch_status" DEFAULT 'DRAFT' NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT '0' NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"bank_id" uuid,
	"bank_file_name" varchar(150),
	"bank_reference" varchar(50),
	"processed_at" timestamp,
	"batch_type" varchar(30) DEFAULT 'PAYMENT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "payment_batches_payment_batch_reference_unique" UNIQUE("payment_batch_reference")
);
--> statement-breakpoint
CREATE TABLE "auth"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"resource" "auth"."permission_resource" NOT NULL,
	"action" "auth"."permission_action" NOT NULL,
	"scope" "auth"."permission_scope" DEFAULT 'own' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"deleted_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "inventory"."product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_id" uuid,
	"price_type" "inventory"."price_type" NOT NULL,
	"base_cost" numeric(18, 6),
	"other_costs" numeric(18, 6) DEFAULT '0.00',
	"purchase_tax" numeric(18, 6) DEFAULT '0.00',
	"total_cost" numeric(18, 6),
	"expense_percent" numeric(5, 2) DEFAULT '0.00',
	"profit_percent" numeric(5, 2) DEFAULT '0.00',
	"sales_tax_percent" numeric(5, 2) DEFAULT '0.00',
	"final_price" numeric(18, 6),
	"supplier_invoice_id" uuid,
	"start_date" date DEFAULT now(),
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory"."product_service_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid,
	"service_id" uuid,
	"fixed_Assets_id" uuid,
	"supplier_id" uuid NOT NULL,
	"lead_time_days" integer DEFAULT 0,
	"preferred" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "inventory"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
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
	"status" "inventory"."product_status" DEFAULT 'DISABLED' NOT NULL,
	"unit_of_measure" "inventory"."unit_of_measure",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"line_type" "purchasing"."purchase_order_type" NOT NULL,
	"itemId" integer,
	"description" varchar(255),
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"total_cost" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" "purchasing"."purchase_order_status" DEFAULT 'PENDING' NOT NULL,
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"subtotal" numeric(18, 2) NOT NULL,
	"tax_amount" numeric(18, 2) DEFAULT '0.00',
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "auth"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"is_custom" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "auth"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"deleted_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory"."service_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"supplier_id" uuid,
	"base_cost" numeric(18, 6),
	"other_costs" numeric(18, 6) DEFAULT '0.00',
	"purchase_tax" numeric(18, 6) DEFAULT '0.00',
	"total_cost" numeric(18, 6),
	"supplier_invoice_id" uuid,
	"start_date" date DEFAULT now(),
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory"."services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_code" varchar(50) NOT NULL,
	"category_id" uuid NOT NULL,
	"description" text,
	"status" "purchasing"."status_suppliers" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "services_service_code_unique" UNIQUE("service_code")
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"refresh_token_expires_at" timestamp NOT NULL,
	"previous_refresh_token_hash" text,
	"last_rotated_at" timestamp,
	"rotation_count" integer DEFAULT 0,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" text,
	"geo_location" jsonb,
	"auth_method" varchar(20),
	"correlation_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"revoked_by" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0.00',
	"available_amount" numeric(18, 2) DEFAULT '0.00',
	"is_authorize_payment" boolean DEFAULT false,
	"status" varchar DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"accounts_payable_id" uuid,
	"credit_note_number" varchar(50) NOT NULL,
	"reason" text,
	"amount" numeric(18, 2) DEFAULT '0.00',
	"available_amount" numeric(18, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "supplier_credit_notes_credit_note_number_unique" UNIQUE("credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_debit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"accounts_payable_id" uuid NOT NULL,
	"debit_note_number" varchar(50) NOT NULL,
	"reason" text,
	"amount" numeric(18, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "supplier_debit_notes_debit_note_number_unique" UNIQUE("debit_note_number")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_type" "purchasing"."purchase_order_type" NOT NULL,
	"item_id" integer,
	"expense_account_id" uuid,
	"description" varchar(255),
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"total_line" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"purchase_order_id" uuid,
	"supplier_invoice_number" varchar(50) NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"control_number" varchar(100),
	"invoice_date" date NOT NULL,
	"due_date" date,
	"subtotal" numeric(18, 2) NOT NULL,
	"tax_amount" numeric(18, 2) DEFAULT '0.00',
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"payment_type" "purchasing"."supplier_invoices_payment" DEFAULT 'CREDIT' NOT NULL,
	"status" "purchasing"."invoice_suppliers_status" DEFAULT 'DRAFT' NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "supplier_invoices_supplier_invoice_number_unique" UNIQUE("supplier_invoice_number")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_payment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_payment_id" uuid NOT NULL,
	"accounts_payable_id" uuid,
	"related_advance_id" integer,
	"amount" numeric(18, 2) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"bank_account_id" uuid,
	"bank_reference" varchar(50),
	"bank_description" varchar(255),
	"bank_transaction_date" date,
	"status" "purchasing"."payment_supplier_status" DEFAULT 'DRAFT' NOT NULL,
	"requested_at" date DEFAULT now() NOT NULL,
	"processed_at" date,
	"reversed_at" date,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "supplier_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_transaction_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"accounts_payable_id" uuid NOT NULL,
	"applied_amount" numeric(18, 2) NOT NULL,
	"application_date" date DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "purchasing"."supplier_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"transaction_type" "purchasing"."supplier_transactions_type" NOT NULL,
	"transaction_date" date NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code" NOT NULL,
	"status" varchar DEFAULT 'ACTIVE' NOT NULL,
	"payment_method" "payment_method",
	"bank_account_id" uuid,
	"bank_reference" varchar(100),
	"bank_transaction_date" date,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "supplier_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "purchasing"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"state" integer,
	"address" text,
	"category" "purchasing"."category_suppliers" NOT NULL,
	"status" "purchasing"."status_suppliers" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code"),
	CONSTRAINT "suppliers_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "audit"."system_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"severity" "audit"."severity_level" NOT NULL,
	"event_type" "audit"."system_event_type" NOT NULL,
	"source" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"stack_trace" text,
	"user_id" uuid,
	"session_id" uuid,
	"correlation_id" uuid,
	"request_path" varchar(500),
	"request_method" varchar(10),
	"request_body" jsonb,
	"metadata" jsonb,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."tenant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tenant"."tenant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tenant"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"rif" varchar(20) NOT NULL,
	"email" varchar(100) NOT NULL,
	"address" text,
	"phone" varchar(50),
	"contact_name" varchar(255),
	"contact_phone" varchar(50),
	"contact_email" varchar(100),
	"contact_cedula" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_rif_unique" UNIQUE("rif")
);
--> statement-breakpoint
CREATE TABLE "auth"."user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"fullname" text NOT NULL,
	"phone" text,
	"email" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_system_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"deleted_by" uuid,
	"deleted_at" timestamp,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "savings"."withdrawal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"withdrawal_percentage" numeric(5, 2),
	"account_debit" uuid,
	"expense_account" uuid,
	"administrative_fee_percentage" numeric(5, 2) DEFAULT '0.00',
	"withdrawal_limit_quantity" integer,
	"minimum_antiquity_days" integer,
	"category_id" uuid,
	"is_house_comercial" boolean DEFAULT false NOT NULL,
	"is_internal_inventory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "withdrawal_types_description_unique" UNIQUE("description")
);
--> statement-breakpoint
CREATE TABLE "savings"."withdrawals_associates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_account_id" uuid NOT NULL,
	"withdrawal_type_id" uuid,
	"withdrawal_date" timestamp DEFAULT now() NOT NULL,
	"requested_amount" numeric(20, 6) NOT NULL,
	"administrative_fee" numeric(20, 6) DEFAULT '0.00',
	"disbursed_amount" numeric(20, 6),
	"payment_method" "payment_method",
	"reference_code" varchar(100),
	"status" "savings"."withdrawal_status" DEFAULT 'REQUESTED' NOT NULL,
	"bank_transaction_id" uuid,
	"commercial_house_id" uuid,
	"withdrawal_items" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "withdrawals_associates_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD CONSTRAINT "account_balances_accounting_cycles_id_accounting_cycles_id_fk" FOREIGN KEY ("accounting_cycles_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_parent_account_id_account_plan_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_cycles" ADD CONSTRAINT "accounting_cycles_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD CONSTRAINT "accounting_entries_accounting_cycle_id_accounting_cycles_id_fk" FOREIGN KEY ("accounting_cycle_id") REFERENCES "accounting"."accounting_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_accounting_entry_id_accounting_entries_id_fk" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rule_details" ADD CONSTRAINT "accounting_rule_details_rule_id_accounting_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "accounting"."accounting_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rule_details" ADD CONSTRAINT "accounting_rule_details_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rules" ADD CONSTRAINT "accounting_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD CONSTRAINT "accounts_payable_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_balance_history" ADD CONSTRAINT "associate_account_balance_history_movement_id_associate_account_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "savings"."associate_account_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_accounts" ADD CONSTRAINT "associate_accounts_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associate_accounts" ADD CONSTRAINT "associate_accounts_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associates" ADD CONSTRAINT "associates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associates" ADD CONSTRAINT "associates_locality_id_states_id_fk" FOREIGN KEY ("locality_id") REFERENCES "core"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associates" ADD CONSTRAINT "associates_payroll_type_id_categories_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."associates" ADD CONSTRAINT "associates_associated_type_id_categories_id_fk" FOREIGN KEY ("associated_type_id") REFERENCES "core"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ADD CONSTRAINT "bank_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ADD CONSTRAINT "bank_accounts_bank_directory_id_bank_directory_id_fk" FOREIGN KEY ("bank_directory_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ADD CONSTRAINT "bank_accounts_linked_chart_account_id_account_plan_id_fk" FOREIGN KEY ("linked_chart_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_accounts" ADD CONSTRAINT "bank_accounts_rule_account_id_accounting_rules_id_fk" FOREIGN KEY ("rule_account_id") REFERENCES "accounting"."accounting_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_category_rule" ADD CONSTRAINT "bank_category_rule_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_category_rule" ADD CONSTRAINT "bank_category_rule_default_debit_account_id_account_plan_id_fk" FOREIGN KEY ("default_debit_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_category_rule" ADD CONSTRAINT "bank_category_rule_default_credit_account_id_account_plan_id_fk" FOREIGN KEY ("default_credit_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_bank_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("bank_reconciliation_id") REFERENCES "treasury"."bank_reconciliations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_accounting_entry_detail_id_accounting_entry_details_id_fk" FOREIGN KEY ("accounting_entry_detail_id") REFERENCES "accounting"."accounting_entry_details"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_adjustment_entry_id_accounting_entries_id_fk" FOREIGN KEY ("adjustment_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_prepared_by_user_id_users_id_fk" FOREIGN KEY ("prepared_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ADD CONSTRAINT "bank_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ADD CONSTRAINT "bank_transactions_bank_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("bank_reconciliation_id") REFERENCES "treasury"."bank_reconciliations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_transactions" ADD CONSTRAINT "bank_transactions_accounting_entry_id_accounting_entries_id_fk" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ADD CONSTRAINT "credit_amortization_schedule_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_days_categories_id_fk" FOREIGN KEY ("days") REFERENCES "core"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD CONSTRAINT "credit_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD CONSTRAINT "credit_payments_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD CONSTRAINT "credit_payments_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_credit_payment_id_credit_payments_id_fk" FOREIGN KEY ("credit_payment_id") REFERENCES "savings"."credit_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_payment_details" ADD CONSTRAINT "credit_payment_details_installment_id_credit_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings"."credit_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_status_history" ADD CONSTRAINT "credit_status_history_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credit_status_history" ADD CONSTRAINT "credit_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_credit_type_id_credits_types_id_fk" FOREIGN KEY ("credit_type_id") REFERENCES "savings"."credits_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_previous_credit_id_credits_id_fk" FOREIGN KEY ("previous_credit_id") REFERENCES "savings"."credits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD CONSTRAINT "credits_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_credit_account_chart_id_account_plan_id_fk" FOREIGN KEY ("credit_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_interest_earned_account_chart_id_account_plan_id_fk" FOREIGN KEY ("interest_earned_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_special_quota_account_chart_id_account_plan_id_fk" FOREIGN KEY ("special_quota_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_expense_account_chart_id_account_plan_id_fk" FOREIGN KEY ("expense_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."credits_types" ADD CONSTRAINT "credits_types_payroll_type_id_categories_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ADD CONSTRAINT "exchange_rates_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "core"."currencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ADD CONSTRAINT "fixed_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets" ADD CONSTRAINT "fixed_assets_category_id_inventories_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "inventory"."inventories_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets_prices" ADD CONSTRAINT "fixed_assets_prices_fixed_assets_id_fixed_assets_id_fk" FOREIGN KEY ("fixed_assets_id") REFERENCES "inventory"."fixed_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets_prices" ADD CONSTRAINT "fixed_assets_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."fixed_assets_prices" ADD CONSTRAINT "fixed_assets_prices_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."internal_transaction_bank_links" ADD CONSTRAINT "internal_transaction_bank_links_linked_by_users_id_fk" FOREIGN KEY ("linked_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventories_categories" ADD CONSTRAINT "inventories_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD CONSTRAINT "inventory_movements_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ADD CONSTRAINT "loan_amortization_schedule_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD CONSTRAINT "loan_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD CONSTRAINT "loan_payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD CONSTRAINT "loan_payments_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_loan_payment_id_loan_payments_id_fk" FOREIGN KEY ("loan_payment_id") REFERENCES "savings"."loan_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_installment_id_loan_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings"."loan_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_status_history" ADD CONSTRAINT "loan_status_history_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_status_history" ADD CONSTRAINT "loan_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_loan_account_chart_id_account_plan_id_fk" FOREIGN KEY ("loan_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_interest_earned_account_chart_id_account_plan_id_fk" FOREIGN KEY ("interest_earned_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_special_quota_account_chart_id_account_plan_id_fk" FOREIGN KEY ("special_quota_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_expense_account_chart_id_account_plan_id_fk" FOREIGN KEY ("expense_account_chart_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loan_types" ADD CONSTRAINT "loan_types_payroll_type_id_categories_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_loan_type_id_loan_types_id_fk" FOREIGN KEY ("loan_type_id") REFERENCES "savings"."loan_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_previous_loan_id_loans_id_fk" FOREIGN KEY ("previous_loan_id") REFERENCES "savings"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_disbursement_account_id_associate_accounts_id_fk" FOREIGN KEY ("disbursement_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_disbursed_by_user_id_users_id_fk" FOREIGN KEY ("disbursed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD CONSTRAINT "loans_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "core"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "core"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "core"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."localities" ADD CONSTRAINT "localities_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "core"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_settings" ADD CONSTRAINT "module_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."municipalities" ADD CONSTRAINT "municipalities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "core"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."parishes" ADD CONSTRAINT "parishes_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "core"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_payment_batch_id_payment_batches_id_fk" FOREIGN KEY ("payment_batch_id") REFERENCES "savings"."payment_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD CONSTRAINT "payment_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD CONSTRAINT "payment_batches_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_prices" ADD CONSTRAINT "product_prices_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "inventory"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_fixed_Assets_id_fixed_assets_id_fk" FOREIGN KEY ("fixed_Assets_id") REFERENCES "inventory"."fixed_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."product_service_suppliers" ADD CONSTRAINT "product_service_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_category_id_inventories_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "inventory"."inventories_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "purchasing"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ADD CONSTRAINT "service_prices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "inventory"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ADD CONSTRAINT "service_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."service_prices" ADD CONSTRAINT "service_prices_supplier_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."services" ADD CONSTRAINT "services_category_id_inventories_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "inventory"."inventories_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ADD CONSTRAINT "supplier_advances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ADD CONSTRAINT "supplier_advances_transaction_id_supplier_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "purchasing"."supplier_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_advances" ADD CONSTRAINT "supplier_advances_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ADD CONSTRAINT "supplier_credit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ADD CONSTRAINT "supplier_credit_notes_transaction_id_supplier_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "purchasing"."supplier_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ADD CONSTRAINT "supplier_credit_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_credit_notes" ADD CONSTRAINT "supplier_credit_notes_accounts_payable_id_accounts_payable_id_fk" FOREIGN KEY ("accounts_payable_id") REFERENCES "purchasing"."accounts_payable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ADD CONSTRAINT "supplier_debit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ADD CONSTRAINT "supplier_debit_notes_transaction_id_supplier_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "purchasing"."supplier_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ADD CONSTRAINT "supplier_debit_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_debit_notes" ADD CONSTRAINT "supplier_debit_notes_accounts_payable_id_accounts_payable_id_fk" FOREIGN KEY ("accounts_payable_id") REFERENCES "purchasing"."accounts_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "purchasing"."supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_expense_account_id_account_plan_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "purchasing"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payment_lines" ADD CONSTRAINT "supplier_payment_lines_supplier_payment_id_supplier_payments_id_fk" FOREIGN KEY ("supplier_payment_id") REFERENCES "purchasing"."supplier_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payment_lines" ADD CONSTRAINT "supplier_payment_lines_accounts_payable_id_accounts_payable_id_fk" FOREIGN KEY ("accounts_payable_id") REFERENCES "purchasing"."accounts_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD CONSTRAINT "supplier_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD CONSTRAINT "supplier_payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transaction_applications" ADD CONSTRAINT "supplier_transaction_applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transaction_applications" ADD CONSTRAINT "supplier_transaction_applications_transaction_id_supplier_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "purchasing"."supplier_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transaction_applications" ADD CONSTRAINT "supplier_transaction_applications_accounts_payable_id_accounts_payable_id_fk" FOREIGN KEY ("accounts_payable_id") REFERENCES "purchasing"."accounts_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ADD CONSTRAINT "suppliers_state_states_id_fk" FOREIGN KEY ("state") REFERENCES "core"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."system_events" ADD CONSTRAINT "system_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."tenant_members" ADD CONSTRAINT "tenant_members_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_account_debit_account_plan_id_fk" FOREIGN KEY ("account_debit") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_expense_account_account_plan_id_fk" FOREIGN KEY ("expense_account") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ADD CONSTRAINT "withdrawal_types_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "core"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_withdrawal_type_id_withdrawal_types_id_fk" FOREIGN KEY ("withdrawal_type_id") REFERENCES "savings"."withdrawal_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_commercial_house_id_suppliers_id_fk" FOREIGN KEY ("commercial_house_id") REFERENCES "purchasing"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_balances_cycle_idx" ON "accounting"."account_balances" USING btree ("accounting_cycles_id");--> statement-breakpoint
CREATE INDEX "account_balances_plan_idx" ON "accounting"."account_balances" USING btree ("account_plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_plan_code_savings_bank_uidx" ON "accounting"."account_plan" USING btree ("code","tenant_id");--> statement-breakpoint
CREATE INDEX "account_plan_name_idx" ON "accounting"."account_plan" USING btree ("name");--> statement-breakpoint
CREATE INDEX "account_plan_type_idx" ON "accounting"."account_plan" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "account_plan_parent_idx" ON "accounting"."account_plan" USING btree ("parent_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_cycles_sb_start_end_uidx" ON "accounting"."accounting_cycles" USING btree ("tenant_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "accounting_cycles_status_idx" ON "accounting"."accounting_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "accounting_entries_cycle_date_idx" ON "accounting"."accounting_entries" USING btree ("accounting_cycle_id","entry_date");--> statement-breakpoint
CREATE INDEX "accounting_entries_origin_idx" ON "accounting"."accounting_entries" USING btree ("origin_type","origin_reference_id");--> statement-breakpoint
CREATE INDEX "accounting_entries_status_idx" ON "accounting"."accounting_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "acct_entry_details_entry_idx" ON "accounting"."accounting_entry_details" USING btree ("accounting_entry_id");--> statement-breakpoint
CREATE INDEX "acct_entry_details_account_idx" ON "accounting"."accounting_entry_details" USING btree ("account_plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payable_invoice_uidx" ON "purchasing"."accounts_payable" USING btree ("tenant_id","supplier_invoice_id");--> statement-breakpoint
CREATE INDEX "ap_status_idx" ON "purchasing"."accounts_payable" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_account_date_idx" ON "savings"."associate_account_balance_history" USING btree ("associate_account_id","balance_date");--> statement-breakpoint
CREATE INDEX "assoc_acct_bal_hist_movement_idx" ON "savings"."associate_account_balance_history" USING btree ("movement_id");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_account_date_idx" ON "savings"."associate_account_movements" USING btree ("associate_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_type_idx" ON "savings"."associate_account_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_reference_idx" ON "savings"."associate_account_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "assoc_acct_mov_exchange_rate_idx" ON "savings"."associate_account_movements" USING btree ("exchange_rate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "associate_accounts_account_number_uidx" ON "savings"."associate_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "associate_accounts_associate_idx" ON "savings"."associate_accounts" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "associate_accounts_status_idx" ON "savings"."associate_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "associate_accounts_currency_idx" ON "savings"."associate_accounts" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "associate_opening_date_idx" ON "savings"."associate_accounts" USING btree ("opening_date");--> statement-breakpoint
CREATE INDEX "associate_accounts_closing_date_idx" ON "savings"."associate_accounts" USING btree ("closing_date");--> statement-breakpoint
CREATE UNIQUE INDEX "associates_cedula_savings_bank_uidx" ON "savings"."associates" USING btree ("cedula","tenant_id");--> statement-breakpoint
CREATE INDEX "associates_fullname_idx" ON "savings"."associates" USING btree ("fullname");--> statement-breakpoint
CREATE INDEX "associates_date_admission_idx" ON "savings"."associates" USING btree ("admission_date");--> statement-breakpoint
CREATE INDEX "associates_date_graduation_idx" ON "savings"."associates" USING btree ("graduation_date");--> statement-breakpoint
CREATE INDEX "associates_status_idx" ON "savings"."associates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "associates_is_payroll_credit_idx" ON "savings"."associates" USING btree ("is_payroll_credit");--> statement-breakpoint
CREATE INDEX "associates_payroll_type_idx" ON "savings"."associates" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "associates_type_idx" ON "savings"."associates" USING btree ("associated_type_id");--> statement-breakpoint
CREATE INDEX "associates_locality_idx" ON "savings"."associates" USING btree ("locality_id");--> statement-breakpoint
CREATE INDEX "audit_user_id_idx" ON "audit"."audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_target_type_idx" ON "audit"."audit_events" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "audit_target_id_idx" ON "audit"."audit_events" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit"."audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit"."audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_tenant_id_idx" ON "audit"."audit_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_correlation_id_idx" ON "audit"."audit_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_account_number_uidx" ON "treasury"."bank_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "bank_accounts_sb_idx" ON "treasury"."bank_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_currency_idx" ON "treasury"."bank_accounts" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "bank_accounts_chart_acc_idx" ON "treasury"."bank_accounts" USING btree ("linked_chart_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bcr_cat_table_uidx" ON "treasury"."bank_category_rule" USING btree ("category","internal_table");--> statement-breakpoint
CREATE INDEX "bank_directory_code_idx" ON "treasury"."bank_directory" USING btree ("code");--> statement-breakpoint
CREATE INDEX "bank_directory_name_idx" ON "treasury"."bank_directory" USING btree ("name");--> statement-breakpoint
CREATE INDEX "bank_recon_details_recon_idx" ON "treasury"."bank_reconciliation_details" USING btree ("bank_reconciliation_id");--> statement-breakpoint
CREATE INDEX "bank_recon_details_bank_trans_idx" ON "treasury"."bank_reconciliation_details" USING btree ("bank_transaction_id");--> statement-breakpoint
CREATE INDEX "bank_recon_details_acct_entry_detail_idx" ON "treasury"."bank_reconciliation_details" USING btree ("accounting_entry_detail_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_recon_account_stmt_date_uidx" ON "treasury"."bank_reconciliations" USING btree ("bank_account_id","statement_date");--> statement-breakpoint
CREATE INDEX "bank_recon_status_idx" ON "treasury"."bank_reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bank_trans_account_date_idx" ON "treasury"."bank_transactions" USING btree ("bank_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX "bank_trans_bank_ref_idx" ON "treasury"."bank_transactions" USING btree ("bank_account_id","bank_reference");--> statement-breakpoint
CREATE INDEX "bank_trans_recon_status_idx" ON "treasury"."bank_transactions" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "bank_trans_recon_id_idx" ON "treasury"."bank_transactions" USING btree ("bank_reconciliation_id");--> statement-breakpoint
CREATE INDEX "categories_type_idx" ON "core"."categories" USING btree ("type");--> statement-breakpoint
CREATE INDEX "categories_code_idx" ON "core"."categories" USING btree ("type","code");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "core"."categories" USING btree ("type","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_amort_credit_installment_uidx" ON "savings"."credit_amortization_schedule" USING btree ("credit_id","installment_number");--> statement-breakpoint
CREATE INDEX "credit_amort_due_date_status_idx" ON "savings"."credit_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE INDEX "credit_item_sale_credit_id_idx" ON "savings"."credit_item_sales" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "credit_item_sale_type_idx" ON "savings"."credit_item_sales" USING btree ("item_type");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_payments_uidx" ON "savings"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_date_idx" ON "savings"."credit_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "credit_payments_reference_idx" ON "savings"."credit_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_transaction_reference_idx" ON "savings"."credit_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "credit_payments_details_installment_idx" ON "savings"."credit_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "credit_status_history_idx" ON "savings"."credit_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_associate_idx" ON "savings"."credits" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "credit_status_date_idx" ON "savings"."credits" USING btree ("status","request_date");--> statement-breakpoint
CREATE INDEX "credits_types_name_idx" ON "savings"."credits_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "credits_types_credit_account_chart_id_idx" ON "savings"."credits_types" USING btree ("credit_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_interest_earned_account_chart_id_idx" ON "savings"."credits_types" USING btree ("interest_earned_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_special_quota_account_chart_id_idx" ON "savings"."credits_types" USING btree ("special_quota_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_expense_account_chart_id_idx" ON "savings"."credits_types" USING btree ("expense_account_chart_id");--> statement-breakpoint
CREATE INDEX "credits_types_payroll_type_id_idx" ON "savings"."credits_types" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "exchange_rates_currency_idx" ON "core"."exchange_rates" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "exchange_rates_date_idx" ON "core"."exchange_rates" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "fixed_asset_code_idx" ON "inventory"."fixed_assets" USING btree ("asset_code");--> statement-breakpoint
CREATE INDEX "fixed_asset_cat_id_idx" ON "inventory"."fixed_assets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "fixed_asset_status_idx" ON "inventory"."fixed_assets" USING btree ("asset_status");--> statement-breakpoint
CREATE INDEX "global_settings_key_idx" ON "core"."global_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "global_settings_category_idx" ON "core"."global_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "int_trans_links_bank_trans_id_idx" ON "treasury"."internal_transaction_bank_links" USING btree ("bank_transaction_id");--> statement-breakpoint
CREATE INDEX "int_trans_links_internal_record_idx" ON "treasury"."internal_transaction_bank_links" USING btree ("internal_record_type","internal_record_id");--> statement-breakpoint
CREATE INDEX "inventory_categories_name_idx" ON "inventory"."inventories_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "inventory_categories_group_idx" ON "inventory"."inventories_categories" USING btree ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "liquidations_associate_liquidation_uidx" ON "savings"."liquidations_associates" USING btree ("associate_id","liquidation_date");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_amort_loan_installment_uidx" ON "savings"."loan_amortization_schedule" USING btree ("loan_id","installment_number");--> statement-breakpoint
CREATE INDEX "loan_amort_due_date_status_idx" ON "savings"."loan_amortization_schedule" USING btree ("due_date","payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_payments_uidx" ON "savings"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_date_idx" ON "savings"."loan_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "loan_payments_reference_idx" ON "savings"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_transaction_reference_idx" ON "savings"."loan_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_details_installment_idx" ON "savings"."loan_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "loan_status_history_idx" ON "savings"."loan_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loan_types_name_idx" ON "savings"."loan_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "loan_types_loan_account_chart_id_idx" ON "savings"."loan_types" USING btree ("loan_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_interest_earned_account_chart_id_idx" ON "savings"."loan_types" USING btree ("interest_earned_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_special_quota_account_chart_id_idx" ON "savings"."loan_types" USING btree ("special_quota_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_expense_account_chart_id_idx" ON "savings"."loan_types" USING btree ("expense_account_chart_id");--> statement-breakpoint
CREATE INDEX "loan_types_payroll_type_id_idx" ON "savings"."loan_types" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "loans_associate_idx" ON "savings"."loans" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "loans_status_date_idx" ON "savings"."loans" USING btree ("status","request_date");--> statement-breakpoint
CREATE UNIQUE INDEX "localities_index_idx" ON "core"."localities" USING btree ("state_id","municipality_id","parish_id");--> statement-breakpoint
CREATE INDEX "localities_index_00" ON "core"."localities" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "localities_index_idx01" ON "core"."localities" USING btree ("municipality_id");--> statement-breakpoint
CREATE INDEX "localities_index_idx02" ON "core"."localities" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "login_attempts_user_id_idx" ON "auth"."login_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_attempts_username_idx" ON "auth"."login_attempts" USING btree ("username");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_address_idx" ON "auth"."login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "login_attempts_created_at_idx" ON "auth"."login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_success_idx" ON "auth"."login_attempts" USING btree ("success");--> statement-breakpoint
CREATE INDEX "login_attempts_correlation_id_idx" ON "auth"."login_attempts" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "module_settings_tenant_idx" ON "core"."module_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "module_settings_module_idx" ON "core"."module_settings" USING btree ("tenant_id","module");--> statement-breakpoint
CREATE UNIQUE INDEX "module_settings_composite_key_uidx" ON "core"."module_settings" USING btree ("tenant_id","module","submodule","key");--> statement-breakpoint
CREATE INDEX "municipalities_index_idx" ON "core"."municipalities" USING btree ("id","name","state_id");--> statement-breakpoint
CREATE INDEX "parishes_index_idx" ON "core"."parishes" USING btree ("id","name","municipality_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_resource_action_scope_idx" ON "auth"."permissions" USING btree ("resource","action","scope");--> statement-breakpoint
CREATE INDEX "permissions_resource_idx" ON "auth"."permissions" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "permissions_action_idx" ON "auth"."permissions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "permissions_scope_idx" ON "auth"."permissions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "permissions_is_active_idx" ON "auth"."permissions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "product_idx" ON "inventory"."product_service_suppliers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "service_idx" ON "inventory"."product_service_suppliers" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "supplier_idx" ON "inventory"."product_service_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "sales_prod_sku_idx" ON "inventory"."products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "sales_prod_name_idx" ON "inventory"."products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "sales_prod_cat_id_idx" ON "inventory"."products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "po_order_number_idx" ON "purchasing"."purchase_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "auth"."role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "auth"."role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_tenant_name_idx" ON "auth"."roles" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "roles_tenant_id_idx" ON "auth"."roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "roles_is_default_idx" ON "auth"."roles" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_refresh_token_hash_idx" ON "auth"."sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_revoked_at_idx" ON "auth"."sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "sessions_is_active_idx" ON "auth"."sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sessions_correlation_id_idx" ON "auth"."sessions" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "sessions_device_fingerprint_idx" ON "auth"."sessions" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "sessions_created_at_idx" ON "auth"."sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "states_name_idx" ON "core"."states" USING btree ("id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "si_invoice_unique_idx" ON "purchasing"."supplier_invoices" USING btree ("supplier_id","invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "st_tn_comp_uidx" ON "purchasing"."supplier_transactions" USING btree ("tenant_id","transaction_number");--> statement-breakpoint
CREATE INDEX "supplier_name_idx" ON "purchasing"."suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "supplier_tax_idx" ON "purchasing"."suppliers" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "system_severity_idx" ON "audit"."system_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "system_event_type_idx" ON "audit"."system_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "system_source_idx" ON "audit"."system_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "system_created_at_idx" ON "audit"."system_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_resolved_at_idx" ON "audit"."system_events" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "system_tenant_id_idx" ON "audit"."system_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_members_user_tenant_idx" ON "auth"."tenant_members" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_members_tenant_id_idx" ON "auth"."tenant_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_members_user_id_idx" ON "auth"."tenant_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_members_role_id_idx" ON "auth"."tenant_members" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "tenant_settings_tenant_idx" ON "tenant"."tenant_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_settings_key_idx" ON "tenant"."tenant_settings" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX "tenants_rif_idx" ON "tenant"."tenants" USING btree ("rif");--> statement-breakpoint
CREATE INDEX "tenants_active_idx" ON "tenant"."tenants" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "user_permissions_tenant_user_perm_idx" ON "auth"."user_permissions" USING btree ("tenant_id","user_id","permission_id");--> statement-breakpoint
CREATE INDEX "user_permissions_tenant_id_idx" ON "auth"."user_permissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_permissions_user_id_idx" ON "auth"."user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "auth"."users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "auth"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "auth"."users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_is_system_admin_idx" ON "auth"."users" USING btree ("is_system_admin");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawal_types_description_uidx" ON "savings"."withdrawal_types" USING btree ("description");--> statement-breakpoint
CREATE INDEX "withdrawal_types_account_debit_idx" ON "savings"."withdrawal_types" USING btree ("account_debit");--> statement-breakpoint
CREATE INDEX "withdrawal_types_expense_account_idx" ON "savings"."withdrawal_types" USING btree ("expense_account");--> statement-breakpoint
CREATE INDEX "withdrawal_types_frequency_relation_idx" ON "savings"."withdrawal_types" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "withdrawals_associate_account_idx" ON "savings"."withdrawals_associates" USING btree ("associate_account_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_type_idx" ON "savings"."withdrawals_associates" USING btree ("withdrawal_type_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_date_idx" ON "savings"."withdrawals_associates" USING btree ("withdrawal_date");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawals_reference_code_uidx" ON "savings"."withdrawals_associates" USING btree ("reference_code");--> statement-breakpoint
CREATE VIEW "accounting"."accounting_balance" AS (
  SELECT
    ap.tenant_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, 'VES') AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance
  FROM "accounting"."account_plan" ap
  LEFT JOIN "accounting"."accounting_entry_details" aed ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ap.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ap.tenant_id, ap.id, ap.code, ap.name, ap.nature, COALESCE(ae.currency_code, 'VES')
);--> statement-breakpoint
CREATE VIEW "accounting"."accounting_balance_by_bank" AS (
  SELECT
    ba.tenant_id,
    ba.id AS bank_account_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, ba.currency_code) AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance
  FROM "treasury"."bank_accounts" ba
  INNER JOIN "accounting"."account_plan" ap ON ap.id = ba.linked_chart_account_id
  LEFT JOIN "accounting"."accounting_entry_details" aed ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ba.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ba.tenant_id, ba.id, ap.id, ap.code, ap.name, ap.nature,
           COALESCE(ae.currency_code, ba.currency_code)
);--> statement-breakpoint
CREATE VIEW "accounting"."period_account_movements_view" AS (
  SELECT
    aed.account_plan_id,
    ae.accounting_cycle_id,
    COALESCE(SUM(aed.debit), 0) AS period_debit,
    COALESCE(SUM(aed.credit), 0) AS period_credit
  FROM "accounting"."accounting_entry_details" aed
  INNER JOIN "accounting"."accounting_entries" ae ON aed.accounting_entry_id = ae.id
  WHERE ae.status = 'POSTED'
  GROUP BY aed.account_plan_id, ae.accounting_cycle_id
);--> statement-breakpoint
CREATE VIEW "accounting"."active_account_balances_view" AS (
  SELECT
    ab.account_plan_id,
    ab.tenant_id,
    ab.accounting_cycles_id AS accounting_cycle_id,
    ap.code AS account_code,
    ap.name AS account_name,
    ap.nature,
    ab.initial_balance,
    COALESCE(pam.period_debit, 0) AS period_debit,
    COALESCE(pam.period_credit, 0) AS period_credit,
    CASE
      WHEN ap.nature = 'DEBIT' THEN (ab.initial_balance + COALESCE(pam.period_debit, 0) - COALESCE(pam.period_credit, 0))
      WHEN ap.nature = 'CREDIT' THEN (ab.initial_balance + COALESCE(pam.period_credit, 0) - COALESCE(pam.period_debit, 0))
      ELSE 0
    END AS current_balance
  FROM "accounting"."account_balances" ab
  INNER JOIN "accounting"."account_plan" ap ON ab.account_plan_id = ap.id
  LEFT JOIN "accounting"."period_account_movements_view" pam
    ON ab.account_plan_id = pam.account_plan_id AND ab.accounting_cycles_id = pam.accounting_cycle_id
);--> statement-breakpoint
CREATE VIEW "inventory"."inventory_availability" AS (
  SELECT
    item_id,
    item_type,
    SUM(
      CASE
        WHEN movement_type IN ('IN','ADJUST_IN') THEN quantity
        WHEN movement_type IN ('OUT','ADJUST_OUT') THEN -quantity
        ELSE quantity
      END
    ) AS available_quantity,
    tenant_id
  FROM "inventory"."inventory_movements"
  GROUP BY item_id, item_type, tenant_id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_advances_360" AS (
  SELECT
    s.tenant_id,
    s.id                                          AS supplier_id,
    COUNT(a.id)                                   AS advances_count,
    COALESCE(SUM(a.amount), 0)                    AS advances_total,
    COALESCE(SUM(a.available_amount), 0)          AS advances_available
  FROM "purchasing"."suppliers" s
  LEFT JOIN "purchasing"."supplier_advances" a ON a.supplier_id = s.id
  GROUP BY s.id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_ap_360" AS (
  SELECT
    s.tenant_id,
    s.id                                      AS supplier_id,
    COUNT(ap.id)                              AS ap_count,
    COALESCE(SUM(ap.original_amount), 0)      AS ap_original,
    COALESCE(SUM(ap.paid_amount), 0)          AS ap_paid,
    COALESCE(SUM(ap.remaining_amount), 0)     AS ap_remaining,
    COALESCE(SUM(ap.remaining_amount) FILTER (WHERE ap.due_date < CURRENT_DATE), 0) AS ap_overdue
  FROM "purchasing"."suppliers" s
  LEFT JOIN "purchasing"."accounts_payable" ap ON ap.supplier_id = s.id
  GROUP BY s.id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_master_360" AS (
  SELECT
    s.id            AS supplier_id,
    s.tenant_id,
    s.code,
    s.name,
    s.tax_id,
    s.category::text,
    s.status::text,
    s.contact_name,
    s.contact_email,
    s.contact_phone,
    s.address,
    st.name         AS state_name
  FROM "purchasing"."suppliers" s
  LEFT JOIN "core"."states" st ON st.id = s.state
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_notes_360" AS (
  SELECT
    s.tenant_id,
    s.id            AS supplier_id,
    COUNT(DISTINCT cn.id)                          AS cn_count,
    COALESCE(SUM(cn.amount), 0)                    AS cn_amount,
    COALESCE(SUM(cn.available_amount), 0)          AS cn_available,
    COUNT(DISTINCT dn.id)                          AS dn_count,
    COALESCE(SUM(dn.amount), 0)                    AS dn_amount
  FROM "purchasing"."suppliers" s
  LEFT JOIN "purchasing"."supplier_credit_notes" cn ON cn.supplier_id = s.id
  LEFT JOIN "purchasing"."supplier_debit_notes" dn ON dn.supplier_id = s.id
  GROUP BY s.id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_payments_360" AS (
  SELECT
    s.tenant_id,
    s.id            AS supplier_id,
    COUNT(p.id)                                AS payments_count,
    COALESCE(SUM(p.total_amount), 0)           AS payments_total,
    MAX(p.requested_at)                        AS last_payment_date
  FROM "purchasing"."suppliers" s
  LEFT JOIN "purchasing"."supplier_payments" p ON p.supplier_id = s.id
  GROUP BY s.id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_purchases_360" AS (
  SELECT
    s.tenant_id,
    s.id                                     AS supplier_id,
    COUNT(DISTINCT po.id)                    AS po_count,
    COUNT(DISTINCT po.id) FILTER (WHERE po.status = 'PENDING') AS po_pending,
    COUNT(DISTINCT inv.id)                   AS invoices_count,
    COALESCE(SUM(inv.total_amount), 0)       AS invoices_total,
    MAX(inv.invoice_date)                    AS last_invoice_date
  FROM "purchasing"."suppliers" s
  LEFT JOIN "purchasing"."purchase_orders" po ON po.supplier_id = s.id
  LEFT JOIN "purchasing"."supplier_invoices" inv ON inv.supplier_id = s.id
  GROUP BY s.id
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_total_360" AS (
  SELECT
    m.supplier_id,
    m.tenant_id,
    m.code,
    m.name,
    m.tax_id,
    m.category,
    m.status,
    m.contact_name,
    m.contact_email,
    m.contact_phone,
    m.address,
    m.state_name,
    COALESCE(p.po_count, 0)             AS po_count,
    COALESCE(p.po_pending, 0)           AS po_pending,
    COALESCE(p.invoices_count, 0)       AS invoices_count,
    COALESCE(p.invoices_total, 0)       AS invoices_total,
    p.last_invoice_date,
    COALESCE(ap.ap_count, 0)            AS ap_count,
    COALESCE(ap.ap_original, 0)         AS ap_original,
    COALESCE(ap.ap_paid, 0)             AS ap_paid,
    COALESCE(ap.ap_remaining, 0)        AS ap_remaining,
    COALESCE(ap.ap_overdue, 0)          AS ap_overdue,
    COALESCE(adv.advances_count, 0)     AS advances_count,
    COALESCE(adv.advances_total, 0)     AS advances_total,
    COALESCE(adv.advances_available, 0) AS advances_available,
    COALESCE(n.cn_count, 0)             AS cn_count,
    COALESCE(n.cn_amount, 0)            AS cn_amount,
    COALESCE(n.cn_available, 0)         AS cn_available,
    COALESCE(n.dn_count, 0)             AS dn_count,
    COALESCE(n.dn_amount, 0)            AS dn_amount,
    COALESCE(py.payments_count, 0)      AS payments_count,
    COALESCE(py.payments_total, 0)      AS payments_total,
    py.last_payment_date,
    /* saldo neto = AP pendiente + ND - NC disponible - anticipos disponibles - pagos */
    COALESCE(ap.ap_remaining, 0)
      + COALESCE(n.dn_amount, 0)
      - COALESCE(n.cn_available, 0)
      - COALESCE(adv.advances_available, 0)
      - COALESCE(py.payments_total, 0)    AS net_balance
  FROM "purchasing"."supplier_master_360" m
  LEFT JOIN "purchasing"."supplier_purchases_360" p ON p.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_ap_360" ap ON ap.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_advances_360" adv ON adv.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_notes_360" n ON n.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_payments_360" py ON py.supplier_id = m.supplier_id
);--> statement-breakpoint
CREATE VIEW "savings"."associate_account_balances" AS (
    SELECT
      aa.id AS associate_account_id,
      aa.associate_id,
      aa.account_number,
      aa.currency_code,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type IN (
            'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION',
            'LOAN_DISBURSEMENT_CREDIT','SPECIAL_LOAN_DISBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT','SPECIAL_CREDIT_DISBURSEMENT_CREDIT',
            'LOAN_REFINANCING_CREDIT','LOAN_REIMBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT','LOAN_OVERPAYMENT_CREDIT',
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT','LOAN_PARTIAL_DISBURSEMENT_CREDIT',
            'DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT','ADJUSTMENT_CREDIT','OTHER_CREDIT'
          ) THEN aam.amount
          WHEN aam.movement_type IN (
            'SAVING_WITHDRAWAL','LOAN_REFINANCING_DEBIT','LOAN_PAYMENT_DEBIT',
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT','WITHDRAWAL_FEE_DEBIT',
            'LOAN_INTEREST_DEBIT','LOAN_FEE_DEBIT','LOAN_ADMIN_FEE_DEBIT',
            'LATE_PAYMENT_FEE_DEBIT','PAYMENT_REVERSAL_DEBIT',
            'CREDIT_ADMIN_FEE_DEBIT','ADJUSTMENT_DEBIT','FEE_CORRECTION_DEBIT',
            'ADMIN_FEE_DEBIT','OTHER_DEBIT','FEE_DEBIT'
          ) THEN -aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM "savings"."associate_accounts" aa
    LEFT JOIN "savings"."associate_account_movements" aam
      ON aa.id = aam.associate_account_id AND aam.status = 'COMPLETED'
    GROUP BY aa.id, aa.associate_id, aa.account_number, aa.currency_code
  );--> statement-breakpoint
CREATE VIEW "savings"."associate_haberes_balance" AS (
  SELECT
    associate_account_id,
    COALESCE(SUM(amount_change), 0) AS haberes_balance,
    MAX(transaction_date) AS last_movement_date,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_CONTRIBUTION'), 0) AS haberes_contribution,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'VOLUNTARY_SAVINGS'), 0) AS haberes_voluntary,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'EMPLOYER_CONTRIBUTION'), 0) AS haberes_employer,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'DIVIDEND_CREDIT'), 0) AS surpluses,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_WITHDRAWAL'), 0) AS total_withdrawals,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'WITHDRAWAL_FEE_DEBIT'), 0) AS total_withdrawal_fees
  FROM (
    SELECT
      associate_account_id,
      movement_type,
      CASE
        WHEN movement_type IN (
          'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION',
          'ADJUSTMENT_CREDIT','DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT',
          'LOAN_OVERPAYMENT_CREDIT','COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',
          'SAVING_WITHDRAWAL_REVERSAL_CREDIT','LIQUIDATION_BALANCE_REVERSAL_CREDIT',
          'ACCOUNTING_ADJUSTMENT_CREDIT','OTHER_CREDIT'
        ) THEN amount
        WHEN movement_type IN (
          'SAVING_WITHDRAWAL','WITHDRAWAL_FEE_DEBIT','ADJUSTMENT_DEBIT',
          'FEE_CORRECTION_DEBIT','PAYMENT_REVERSAL_DEBIT','ADMIN_FEE_DEBIT',
          'OTHER_DEBIT','FEE_DEBIT','LIQUIDATION_BALANCE',
          'ACCOUNTING_ADJUSTMENT_DEBIT','LIQUIDATION_LOAN_PAYMENT_DEBIT',
          'LIQUIDATION_CREDIT_PAYMENT_DEBIT','LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT',
          'LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT','LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT'
        ) THEN -amount
        ELSE 0
      END AS amount_change,
      transaction_date
    FROM "savings"."associate_account_movements"
    WHERE status = 'COMPLETED'
  ) sub
  GROUP BY associate_account_id
);--> statement-breakpoint
CREATE VIEW "savings"."credit_outstanding_balance" AS (
  SELECT
    c.id AS credit_id,
    c.tenant_id,
    c.associate_id,
    c.currency_code,
    c.status::text AS credit_status,
    COALESCE(SUM(cas.principal_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(cas.interest_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(cas.principal_amount + cas.interest_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM "savings"."credits" c
  JOIN "savings"."credit_amortization_schedule" cas ON c.id = cas.credit_id
  WHERE c.status IN ('APPROVED','IN_PAYMENT')
  GROUP BY c.id, c.tenant_id, c.associate_id, c.currency_code, c.status
);--> statement-breakpoint
CREATE VIEW "savings"."loan_outstanding_balance" AS (
  SELECT
    l.id AS loan_id,
    l.tenant_id,
    l.associate_id,
    l.currency_code,
    l.status::text AS loan_status,
    COALESCE(SUM(las.principal_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(las.interest_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(las.principal_amount + las.interest_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM "savings"."loans" l
  JOIN "savings"."loan_amortization_schedule" las ON l.id = las.loan_id
  WHERE l.status IN ('DISBURSED','IN_PAYMENT','OVERDUE')
  GROUP BY l.id, l.tenant_id, l.associate_id, l.currency_code, l.status
);--> statement-breakpoint
CREATE VIEW "treasury"."bank_statement_balance" AS (
  SELECT 
    ba.tenant_id,
    ba.id AS bank_account_id,
    ba.account_number,
    ba.account_name,
    ba.currency_code,
    COALESCE(SUM(bt.credit_amount), 0) AS total_credits,
    COALESCE(SUM(bt.debit_amount), 0) AS total_debits,
    COALESCE(SUM(bt.credit_amount - bt.debit_amount), 0) AS current_statement_balance,
    MAX(bt.transaction_date) AS last_transaction_date
  FROM "treasury"."bank_accounts" ba
  LEFT JOIN "treasury"."bank_transactions" bt ON bt.bank_account_id = ba.id
  GROUP BY ba.id, ba.account_number, ba.account_name, ba.currency_code
);