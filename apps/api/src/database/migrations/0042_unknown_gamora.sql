ALTER TYPE "treasury"."bank_transaction_category" ADD VALUE 'PAYMENT_PRODUCT_WITHDRAWAL' BEFORE 'PAYROLL_SETTLEMENT';--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "goods_total_amount" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_amount" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_currency_code" "currency_code" DEFAULT 'VES';--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_amount_base" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_at" timestamp;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "received_bank_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_received_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("received_bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_received_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("received_bank_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;