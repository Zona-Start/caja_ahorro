DROP TABLE "accounting"."accounting_configuration" CASCADE;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "previous_session_token" varchar;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "last_rotated_at" timestamp;