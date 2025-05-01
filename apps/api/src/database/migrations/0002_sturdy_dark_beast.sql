CREATE TABLE "savings_banks"."withdrawals_associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_account_id" integer NOT NULL,
	"withdrawal_type_id" integer,
	"withdrawal_date" timestamp DEFAULT now() NOT NULL,
	"requested_amount" numeric(18, 2) NOT NULL,
	"administrative_fee" numeric(18, 2) DEFAULT '0.00',
	"disbursed_amount" numeric(18, 2),
	"payment_method" "payment_method_enum",
	"reference_code" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer,
	CONSTRAINT "withdrawals_associates_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "savings_banks"."withdrawals" CASCADE;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings_banks"."associate_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_withdrawal_type_id_withdrawal_types_id_fk" FOREIGN KEY ("withdrawal_type_id") REFERENCES "savings_banks"."withdrawal_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."withdrawals_associates" ADD CONSTRAINT "withdrawals_associates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "withdrawals_associate_account_idx" ON "savings_banks"."withdrawals_associates" USING btree ("associate_account_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_type_idx" ON "savings_banks"."withdrawals_associates" USING btree ("withdrawal_type_id");--> statement-breakpoint
CREATE INDEX "withdrawals_withdrawal_date_idx" ON "savings_banks"."withdrawals_associates" USING btree ("withdrawal_date");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawals_reference_code_uidx" ON "savings_banks"."withdrawals_associates" USING btree ("reference_code");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawal_types_description_uidx" ON "savings_banks"."withdrawal_types" USING btree ("description");--> statement-breakpoint
CREATE INDEX "withdrawal_types_account_debit_idx" ON "savings_banks"."withdrawal_types" USING btree ("account_debit");--> statement-breakpoint
CREATE INDEX "withdrawal_types_expense_account_idx" ON "savings_banks"."withdrawal_types" USING btree ("expense_account");--> statement-breakpoint
CREATE INDEX "withdrawal_types_frequency_relation_idx" ON "savings_banks"."withdrawal_types" USING btree ("category_id");