ALTER TYPE "public"."liquidations_status_enum" ADD VALUE 'REVERSED' BEFORE 'CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."withdrawal_status_enum" ADD VALUE 'REVERSED' BEFORE 'CANCELLED';