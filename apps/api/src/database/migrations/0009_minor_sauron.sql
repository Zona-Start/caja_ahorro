CREATE TYPE "public"."payment_batch_item_type" AS ENUM('LOAN', 'WITHDRAWAL', 'LIQUIDATION');--> statement-breakpoint
CREATE TYPE "public"."payment_batch_status" AS ENUM('DRAFT', 'UPLOADED', 'PROCESSED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "savings_banks"."payment_batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_batch_id" integer,
	"item_type" "payment_batch_item_type" NOT NULL,
	"source_id" integer NOT NULL,
	"associate_account_id" integer,
	"beneficiary_account_number" varchar(50) NOT NULL,
	"beneficiary_account_type" varchar(20) NOT NULL,
	"beneficiary_id" varchar(20) NOT NULL,
	"beneficiary_name" varchar(150) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "savings_banks"."payment_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"description" varchar(100),
	"status" "payment_batch_status" DEFAULT 'DRAFT' NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT '0' NOT NULL,
	"currency_code" "currency_code_enum" NOT NULL,
	"bank_id" integer,
	"bank_file_name" varchar(150),
	"bank_reference" varchar(50),
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" DROP CONSTRAINT "credit_item_sales_days_category_types_id_fk";
--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "delivery_status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "delivery_status" SET DEFAULT 'ENTREGADO';--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_payment_batch_id_payment_batches_id_fk" FOREIGN KEY ("payment_batch_id") REFERENCES "savings_banks"."payment_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batch_items" ADD CONSTRAINT "payment_batch_items_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batches" ADD CONSTRAINT "payment_batches_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "banking"."bank_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batches" ADD CONSTRAINT "payment_batches_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."payment_batches" ADD CONSTRAINT "payment_batches_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_days_category_types_id_fk" FOREIGN KEY ("days") REFERENCES "core"."category_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" DROP COLUMN "item_description";--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" DROP COLUMN "use_commercial_house";