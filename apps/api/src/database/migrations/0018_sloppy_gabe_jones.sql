CREATE TYPE "treasury"."expense_nature" AS ENUM('FIXED', 'VARIABLE');--> statement-breakpoint
ALTER TYPE "treasury"."expense_status" ADD VALUE 'DRAFT' BEFORE 'PENDING_APPROVAL';--> statement-breakpoint
ALTER TYPE "treasury"."expense_status" ADD VALUE 'PAID' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "nature" "treasury"."expense_nature" DEFAULT 'VARIABLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "frequency" "treasury"."recurring_frequency";--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "next_due_date" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "paid_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "treasury"."expenses" ADD CONSTRAINT "expenses_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;