ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "quantity" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "delivery_status" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ALTER COLUMN "delivery_status" SET DEFAULT 'COMMITTED';--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD COLUMN "item_description" text;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD COLUMN "days" integer;