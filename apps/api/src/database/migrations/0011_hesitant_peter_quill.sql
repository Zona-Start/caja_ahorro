ALTER TABLE "savings_banks"."loan_payment_details" DROP CONSTRAINT "loan_payment_details_loan_id_loan_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD COLUMN "loan_payment_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_loan_payment_id_loan_payments_id_fk" FOREIGN KEY ("loan_payment_id") REFERENCES "savings_banks"."loan_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" DROP COLUMN "loan_id";