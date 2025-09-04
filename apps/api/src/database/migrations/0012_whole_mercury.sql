ALTER TYPE "public"."payment_accounts_payable_enum" ADD VALUE 'ADVANCE_APPLIED';--> statement-breakpoint
ALTER TYPE "public"."supplier_transactions_type_enum" ADD VALUE 'ADVANCE_APPLIED';--> statement-breakpoint
ALTER TABLE "administration"."supplier_invoices" ADD COLUMN "draft_applied_advances" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "administration"."supplier_transactions" ADD COLUMN "related_advance_id" integer;--> statement-breakpoint
ALTER TABLE "administration"."supplier_transactions" ADD CONSTRAINT "supplier_transactions_related_advance_id_accounts_payable_id_fk" FOREIGN KEY ("related_advance_id") REFERENCES "administration"."accounts_payable"("id") ON DELETE set null ON UPDATE no action;