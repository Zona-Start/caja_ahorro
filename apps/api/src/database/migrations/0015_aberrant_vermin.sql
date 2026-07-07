ALTER TABLE "savings"."credits" ADD COLUMN "allow_overdraft" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "haberes_payment" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "direct_payment" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "direct_payment_method" varchar(30);--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "direct_payment_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "direct_payment_bank_account_id" uuid;