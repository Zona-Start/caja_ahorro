ALTER TABLE "savings_banks"."credits_types" ALTER COLUMN "credit_account_chart_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ALTER COLUMN "interest_earned_account_chart_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ALTER COLUMN "loan_account_chart_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ALTER COLUMN "interest_earned_account_chart_id" DROP NOT NULL;