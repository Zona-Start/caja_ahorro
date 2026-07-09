ALTER TABLE "savings"."loan_payments" DROP CONSTRAINT "loan_payments_bank_id_bank_directory_id_fk";
--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD CONSTRAINT "loan_payments_bank_id_bank_accounts_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;