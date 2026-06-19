ALTER TABLE "purchasing"."suppliers" RENAME COLUMN "code" TO "internal_code";--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" DROP CONSTRAINT "suppliers_code_unique";--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ADD CONSTRAINT "suppliers_internal_code_unique" UNIQUE("internal_code");