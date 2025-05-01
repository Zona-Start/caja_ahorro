ALTER TYPE "public"."associate_movement_type_enum" ADD VALUE 'FEE_CORRECTION_DEBIT';--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD COLUMN "reference_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ADD CONSTRAINT "associate_account_movements_reference_number_unique" UNIQUE("reference_number");