ALTER TABLE "savings"."credit_payments" DROP CONSTRAINT "credit_payments_bank_id_bank_directory_id_fk";
--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD CONSTRAINT "credit_payments_bank_id_bank_accounts_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;