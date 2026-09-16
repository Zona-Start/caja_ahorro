CREATE TYPE "treasury"."petty_cash_replenishment_status" AS ENUM('NONE', 'PENDING', 'PAID');--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "petty_cash_settlement_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD COLUMN "replenishment_status" "treasury"."petty_cash_replenishment_status" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD COLUMN "replenishment_amount" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD COLUMN "replenishment_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD COLUMN "replenishment_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD COLUMN "replenishment_paid_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_vouchers" ADD COLUMN "settlement_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."petty_cash_settlements" ADD CONSTRAINT "petty_cash_settlements_replenishment_paid_by_user_id_users_id_fk" FOREIGN KEY ("replenishment_paid_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;