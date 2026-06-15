ALTER TABLE "tenant"."tenant_module_integrations" ALTER COLUMN "source_module" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_module_integrations" ALTER COLUMN "target_module" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_modules" ALTER COLUMN "module_code" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."module_code";--> statement-breakpoint
CREATE TYPE "public"."module_code" AS ENUM('ACCOUNTING', 'LOANS', 'CREDITS', 'SAVINGS', 'INVENTORY', 'PURCHASING', 'SALES', 'BANKING', 'TREASURY', 'HR_PAYROLL', 'AUDIT');--> statement-breakpoint
ALTER TABLE "tenant"."tenant_module_integrations" ALTER COLUMN "source_module" SET DATA TYPE "public"."module_code" USING "source_module"::"public"."module_code";--> statement-breakpoint
ALTER TABLE "tenant"."tenant_module_integrations" ALTER COLUMN "target_module" SET DATA TYPE "public"."module_code" USING "target_module"::"public"."module_code";--> statement-breakpoint
ALTER TABLE "tenant"."tenant_modules" ALTER COLUMN "module_code" SET DATA TYPE "public"."module_code" USING "module_code"::"public"."module_code";