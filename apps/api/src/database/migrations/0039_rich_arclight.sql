CREATE TYPE "savings"."special_operation_item_status" AS ENUM('PROCESSED', 'ERROR');--> statement-breakpoint
CREATE TYPE "savings"."special_operation_movement_type" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "savings"."special_operation_status" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "savings"."special_operation_type" AS ENUM('LIQUIDATION_VS_INCOME', 'LOAN_WITHDRAWAL_VS_SAVINGS');--> statement-breakpoint
CREATE TABLE "savings"."special_operation_account_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"operation_type" "savings"."special_operation_type" NOT NULL,
	"role" varchar(120) NOT NULL,
	"label" varchar(255),
	"account_plan_id" uuid,
	"movement_type" "savings"."special_operation_movement_type" NOT NULL,
	"is_auxiliary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."special_operation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"associate_id" uuid,
	"cedula" varchar(20) NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"amounts" jsonb NOT NULL,
	"status" "savings"."special_operation_item_status" DEFAULT 'PROCESSED' NOT NULL,
	"error_message" text,
	"liquidation_id" uuid,
	"withdrawal_id" uuid,
	"loan_payment_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."special_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reference" varchar(50) NOT NULL,
	"operation_type" "savings"."special_operation_type" NOT NULL,
	"operation_date" date NOT NULL,
	"status" "savings"."special_operation_status" DEFAULT 'PROCESSING' NOT NULL,
	"total_associates" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(20, 6) DEFAULT '0' NOT NULL,
	"currency_code" "currency_code" DEFAULT 'VES' NOT NULL,
	"account_config" jsonb,
	"accounting_entry_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD COLUMN "origin_type" varchar(30);--> statement-breakpoint
ALTER TABLE "savings"."withdrawal_types" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_account_configs" ADD CONSTRAINT "special_operation_account_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_account_configs" ADD CONSTRAINT "special_operation_account_configs_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_items" ADD CONSTRAINT "special_operation_items_operation_id_special_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "savings"."special_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_items" ADD CONSTRAINT "special_operation_items_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_items" ADD CONSTRAINT "special_operation_items_liquidation_id_liquidations_associates_id_fk" FOREIGN KEY ("liquidation_id") REFERENCES "savings"."liquidations_associates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operation_items" ADD CONSTRAINT "special_operation_items_withdrawal_id_withdrawals_associates_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "savings"."withdrawals_associates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operations" ADD CONSTRAINT "special_operations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."special_operations" ADD CONSTRAINT "special_operations_accounting_entry_id_accounting_entries_id_fk" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "special_operation_account_configs_uidx" ON "savings"."special_operation_account_configs" USING btree ("tenant_id","operation_type","role");--> statement-breakpoint
CREATE INDEX "special_operation_items_operation_idx" ON "savings"."special_operation_items" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "special_operation_items_associate_idx" ON "savings"."special_operation_items" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "special_operation_items_cedula_idx" ON "savings"."special_operation_items" USING btree ("cedula");--> statement-breakpoint
CREATE UNIQUE INDEX "special_operations_reference_uidx" ON "savings"."special_operations" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "special_operations_tenant_status_idx" ON "savings"."special_operations" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "special_operations_date_idx" ON "savings"."special_operations" USING btree ("operation_date");
