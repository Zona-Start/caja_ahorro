ALTER TABLE "savings"."loans" ADD COLUMN "bypass_payroll_credit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD COLUMN "bypass_available_balance" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD COLUMN "bypass_payment_capacity" boolean DEFAULT false NOT NULL;