CREATE TABLE "savings"."contribution_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"movement_type" varchar NOT NULL,
	"entry_date" date NOT NULL,
	"associate_id" uuid,
	"description" text,
	"amount_voluntario" numeric(20, 6),
	"amount_patrono" numeric(20, 6),
	"amount_asociado" numeric(20, 6),
	"total_amount" numeric(20, 6) NOT NULL,
	"associate_count" integer DEFAULT 1 NOT NULL,
	"status" varchar DEFAULT 'completed' NOT NULL,
	"accounting_entry_id" uuid,
	"bank_transaction_id" uuid,
	"reversal_entry_id" uuid,
	"bank_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD CONSTRAINT "contribution_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD CONSTRAINT "contribution_batches_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD CONSTRAINT "contribution_batches_accounting_entry_id_accounting_entries_id_fk" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD CONSTRAINT "contribution_batches_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "treasury"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD CONSTRAINT "contribution_batches_reversal_entry_id_accounting_entries_id_fk" FOREIGN KEY ("reversal_entry_id") REFERENCES "accounting"."accounting_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrib_batches_tenant_idx" ON "savings"."contribution_batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "contrib_batches_entry_date_idx" ON "savings"."contribution_batches" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "contrib_batches_status_idx" ON "savings"."contribution_batches" USING btree ("status");