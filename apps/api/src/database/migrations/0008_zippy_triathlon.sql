CREATE TABLE "savings_banks"."loan_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"installment_id" integer,
	"amount" numeric(18, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" DROP CONSTRAINT "loan_payments_installment_id_loan_amortization_schedule_id_fk";
--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" ADD COLUMN "custom_reference" varchar(50);--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_loan_id_loan_payments_id_fk" FOREIGN KEY ("loan_id") REFERENCES "savings_banks"."loan_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_installment_id_loan_amortization_schedule_id_fk" FOREIGN KEY ("installment_id") REFERENCES "savings_banks"."loan_amortization_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payment_details" ADD CONSTRAINT "loan_payment_details_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loan_payments_details_installment_idx" ON "savings_banks"."loan_payment_details" USING btree ("installment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_payments_uidx" ON "savings_banks"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_date_idx" ON "savings_banks"."loan_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "loan_payments_reference_idx" ON "savings_banks"."loan_payments" USING btree ("custom_reference");--> statement-breakpoint
CREATE INDEX "loan_payments_transaction_reference_idx" ON "savings_banks"."loan_payments" USING btree ("transaction_reference");--> statement-breakpoint
CREATE INDEX "loan_status_history_idx" ON "savings_banks"."loan_status_history" USING btree ("status");--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_payments" DROP COLUMN "installment_id";