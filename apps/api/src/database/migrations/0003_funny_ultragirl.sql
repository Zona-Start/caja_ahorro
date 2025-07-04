CREATE TYPE "public"."payment_status" AS ENUM('DONE', 'CANCELED');--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD COLUMN "payment_status" "payment_status" DEFAULT 'DONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD COLUMN "payment_status" "payment_status" DEFAULT 'DONE' NOT NULL;