CREATE TYPE "sales"."delivery_note_status" AS ENUM('DRAFT', 'DISPATCHED', 'INVOICED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "sales"."fiscal_status" AS ENUM('PENDING', 'PRINTED', 'ERROR');--> statement-breakpoint
CREATE TYPE "sales"."sales_invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "sales"."sales_order_status" AS ENUM('DRAFT', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "sales"."sales_quote_status" AS ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "sales"."customer_payment_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_applied" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."customer_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_number" varchar(100),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tax_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"credit_days" integer DEFAULT 0 NOT NULL,
	"credit_limit" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_delivery_note_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_note_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_delivery_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"delivery_number" varchar(50) NOT NULL,
	"status" "sales"."delivery_note_status" DEFAULT 'DRAFT' NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"unit_cost" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"status" "sales"."sales_invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"fiscal_number" varchar(50),
	"fiscal_serial" varchar(100),
	"fiscal_z_report" varchar(50),
	"fiscal_status" "sales"."fiscal_status" DEFAULT 'PENDING' NOT NULL,
	"fiscal_response" jsonb,
	"delivery_note_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"quote_id" uuid,
	"order_number" varchar(50) NOT NULL,
	"status" "sales"."sales_order_status" DEFAULT 'DRAFT' NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."sales_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"quote_number" varchar(50) NOT NULL,
	"status" "sales"."sales_quote_status" DEFAULT 'DRAFT' NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales"."customer_payment_applications" ADD CONSTRAINT "customer_payment_applications_payment_id_customer_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "sales"."customer_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."customer_payment_applications" ADD CONSTRAINT "customer_payment_applications_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "sales"."sales_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."customer_payments" ADD CONSTRAINT "customer_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_delivery_note_items" ADD CONSTRAINT "sales_delivery_note_items_delivery_note_id_sales_delivery_notes_id_fk" FOREIGN KEY ("delivery_note_id") REFERENCES "sales"."sales_delivery_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_delivery_notes" ADD CONSTRAINT "sales_delivery_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_delivery_notes" ADD CONSTRAINT "sales_delivery_notes_order_id_sales_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "sales"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "sales"."sales_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ADD CONSTRAINT "sales_invoices_order_id_sales_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "sales"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ADD CONSTRAINT "sales_invoices_delivery_note_id_sales_delivery_notes_id_fk" FOREIGN KEY ("delivery_note_id") REFERENCES "sales"."sales_delivery_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_order_items" ADD CONSTRAINT "sales_order_items_order_id_sales_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "sales"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ADD CONSTRAINT "sales_orders_quote_id_sales_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."sales_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_quote_items" ADD CONSTRAINT "sales_quote_items_quote_id_sales_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."sales_quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."sales_quotes" ADD CONSTRAINT "sales_quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."customers"("id") ON DELETE no action ON UPDATE no action;