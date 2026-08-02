CREATE TABLE "treasury"."bank_statement_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_reconciliation_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"description" text NOT NULL,
	"bank_reference" varchar(100),
	"debit_amount" numeric(20, 6) DEFAULT '0.00',
	"credit_amount" numeric(20, 6) DEFAULT '0.00',
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"matched_transaction_id" uuid,
	"is_credit" boolean DEFAULT false,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" DROP CONSTRAINT "bank_reconciliation_details_bank_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD COLUMN "statement_line_id" uuid;--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliations" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "treasury"."bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_bank_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("bank_reconciliation_id") REFERENCES "treasury"."bank_reconciliations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "treasury"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury"."bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_matched_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("matched_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stmt_lines_recon_idx" ON "treasury"."bank_statement_lines" USING btree ("bank_reconciliation_id");--> statement-breakpoint
CREATE INDEX "stmt_lines_date_idx" ON "treasury"."bank_statement_lines" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "stmt_lines_ref_idx" ON "treasury"."bank_statement_lines" USING btree ("bank_reference");--> statement-breakpoint
CREATE INDEX "stmt_lines_status_idx" ON "treasury"."bank_statement_lines" USING btree ("status");--> statement-breakpoint
ALTER TABLE "treasury"."bank_reconciliation_details" ADD CONSTRAINT "bank_reconciliation_details_statement_line_id_bank_statement_lines_id_fk" FOREIGN KEY ("statement_line_id") REFERENCES "treasury"."bank_statement_lines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_recon_details_stmt_line_idx" ON "treasury"."bank_reconciliation_details" USING btree ("statement_line_id");--> statement-breakpoint
CREATE INDEX "bank_recon_start_date_idx" ON "treasury"."bank_reconciliations" USING btree ("start_date");