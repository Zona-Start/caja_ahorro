ALTER TYPE "public"."bank_transaction_category" ADD VALUE 'OPENING_BANK' BEFORE 'MEMBER_DUES';--> statement-breakpoint
ALTER TYPE "public"."bank_transaction_category" ADD VALUE 'INITIAL_ADJUSTMENT_BANK' BEFORE 'MEMBER_DUES';--> statement-breakpoint
ALTER TYPE "public"."bank_transaction_category" ADD VALUE 'CLOSING' BEFORE 'MEMBER_DUES';--> statement-breakpoint
ALTER TYPE "public"."bank_transaction_category" ADD VALUE 'DEPOSIT' BEFORE 'MEMBER_DUES';--> statement-breakpoint
ALTER TYPE "public"."bank_transaction_category" ADD VALUE 'WITHDRAWAL' BEFORE 'MEMBER_DUES';