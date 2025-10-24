ALTER TABLE "savings_banks"."credits" ADD COLUMN "interest_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD COLUMN "term_type" varchar(20);--> statement-breakpoint
ALTER TABLE "savings_banks"."credits" ADD COLUMN "term_units" integer;