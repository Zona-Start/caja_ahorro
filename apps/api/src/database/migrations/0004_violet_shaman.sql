DROP VIEW "purchasing"."supplier_total_360";
DROP VIEW "purchasing"."supplier_master_360";--> statement-breakpoint
ALTER TABLE "purchasing"."suppliers" ALTER COLUMN "category" SET DATA TYPE varchar(50);