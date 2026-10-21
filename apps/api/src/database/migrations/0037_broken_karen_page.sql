ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "origin_type" varchar(30);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "credit_id" uuid;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings"."credits"("id") ON DELETE set null ON UPDATE no action;
