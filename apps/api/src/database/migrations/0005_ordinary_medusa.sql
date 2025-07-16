CREATE TYPE "public"."purchase_type_enum" AS ENUM('CASH', 'CREDIT');--> statement-breakpoint
ALTER TABLE "accounts_payable"."purchase_orders" ADD COLUMN "purchaseType" "purchase_type_enum" NOT NULL;