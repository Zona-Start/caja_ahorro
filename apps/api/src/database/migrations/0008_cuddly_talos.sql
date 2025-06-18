ALTER TABLE "savings_banks"."credit_payments" ALTER COLUMN "bank_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ALTER COLUMN "bank_id" DROP NOT NULL;