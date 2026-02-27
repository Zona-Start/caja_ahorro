ALTER TABLE "accounting"."accounting_closings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "accounting"."accounting_closings" CASCADE;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "associate_id" integer;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "supplier_id" integer;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_rule_details" ADD COLUMN "is_auxiliary" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings_banks"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "accounting_entry_details_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "administration"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "only_one_auxiliary_check" CHECK (("accounting"."accounting_entry_details"."associate_id" IS NULL OR "accounting"."accounting_entry_details"."supplier_id" IS NULL));