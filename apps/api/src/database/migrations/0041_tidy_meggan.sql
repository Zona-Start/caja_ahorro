ALTER TABLE "savings"."withdrawal_types" DROP CONSTRAINT "withdrawal_types_description_unique";--> statement-breakpoint
DROP INDEX "savings"."withdrawal_types_description_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawal_types_description_uidx" ON "savings"."withdrawal_types" USING btree ("tenant_id","description");