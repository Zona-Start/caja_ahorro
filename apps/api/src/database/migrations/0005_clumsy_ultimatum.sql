ALTER TABLE "savings_banks"."credits_types" DROP CONSTRAINT "credits_types_payroll_type_id_category_types_id_fk";
--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" DROP CONSTRAINT "loan_types_payroll_type_id_category_types_id_fk";
--> statement-breakpoint
ALTER TABLE "savings_banks"."credits_types" ADD CONSTRAINT "credits_types_payroll_type_id_type_payrolls_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."type_payrolls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."loan_types" ADD CONSTRAINT "loan_types_payroll_type_id_type_payrolls_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "core"."type_payrolls"("id") ON DELETE set null ON UPDATE no action;