CREATE SCHEMA "accounts_payable";
--> statement-breakpoint
CREATE TYPE "public"."category-suppliers" AS ENUM('ASSETS', 'SERVICE', 'PRODUCTS', 'MATERIALS', 'FURNITURE', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."invoice_suppliers_status_enum" AS ENUM('DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."payment_suppliers_status_enum" AS ENUM('REQUESTED', 'PENDING_BANK_BATCH', 'PROCESSED', 'FAILED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."purchase_item_type_enum" AS ENUM('SALES_INVENTORY', 'FIXED_ASSET', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."status-suppliers" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "accounts_payable"."accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"concept" text NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"remaining_amount" numeric(20, 6) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"status" "invoice_suppliers_status_enum" DEFAULT 'PENDING' NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."ap_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payable_id" integer NOT NULL,
	"payment_date" date NOT NULL,
	"amount_paid" numeric(18, 2) NOT NULL,
	"payment_method" "payment_method_enum" NOT NULL,
	"transaction_reference" varchar(255) NOT NULL,
	"status" "payment_suppliers_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"observations" text,
	"is_reversed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"item_type" "purchase_item_type_enum" NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"total_cost" numeric(18, 2) NOT NULL,
	"sales_product_id" integer,
	"fixed_asset_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "accounts_payable"."purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"purchase_date" date NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"payable_id" integer,
	"status" "invoice_suppliers_status_enum" DEFAULT 'PENDING' NOT NULL,
	"description" text,
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
DROP TABLE "inventory"."sales_product_purchases" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."accounts_payable" ADD CONSTRAINT "accounts_payable_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."ap_payments" ADD CONSTRAINT "ap_payments_payable_id_accounts_payable_id_fk" FOREIGN KEY ("payable_id") REFERENCES "accounts_payable"."accounts_payable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."ap_payments" ADD CONSTRAINT "ap_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."ap_payments" ADD CONSTRAINT "ap_payments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_items" ADD CONSTRAINT "purchase_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "accounts_payable"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_items" ADD CONSTRAINT "purchase_items_sales_product_id_sales_products_id_fk" FOREIGN KEY ("sales_product_id") REFERENCES "inventory"."sales_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_items" ADD CONSTRAINT "purchase_items_fixed_asset_id_fixed_assets_id_fk" FOREIGN KEY ("fixed_asset_id") REFERENCES "inventory"."fixed_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_items" ADD CONSTRAINT "purchase_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_items" ADD CONSTRAINT "purchase_items_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "accounts_payable"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_payable_id_accounts_payable_id_fk" FOREIGN KEY ("payable_id") REFERENCES "accounts_payable"."accounts_payable"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_state_states_id_fk" FOREIGN KEY ("state") REFERENCES "core"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable"."suppliers" ADD CONSTRAINT "suppliers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ap_invoice_uidx" ON "accounts_payable"."accounts_payable" USING btree ("supplier_id","invoice_number");--> statement-breakpoint
CREATE INDEX "ap_status_idx" ON "accounts_payable"."accounts_payable" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ap_due_date_idx" ON "accounts_payable"."accounts_payable" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payment_payable_idx" ON "accounts_payable"."ap_payments" USING btree ("payable_id");--> statement-breakpoint
CREATE INDEX "payment_date_idx" ON "accounts_payable"."ap_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_invoice_uidx" ON "accounts_payable"."purchase_orders" USING btree ("supplier_id","invoice_number");--> statement-breakpoint
CREATE INDEX "supplier_name_idx" ON "accounts_payable"."suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "supplier_tax_idx" ON "accounts_payable"."suppliers" USING btree ("tax_id");