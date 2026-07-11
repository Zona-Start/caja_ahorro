ALTER TABLE "savings"."payment_batches" DROP CONSTRAINT "payment_batches_bank_id_bank_directory_id_fk";
--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD CONSTRAINT "payment_batches_bank_id_bank_accounts_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;