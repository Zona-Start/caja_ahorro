ALTER TYPE "public"."movement_status" ADD VALUE 'REVERSED';--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ALTER COLUMN "status" SET DEFAULT 'PENDING';