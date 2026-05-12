ALTER TYPE "auth"."permission_resource" ADD VALUE 'savings:withdrawal-types' BEFORE 'savings:liquidations';--> statement-breakpoint
ALTER TYPE "auth"."permission_resource" ADD VALUE 'portfolio:loans-types' BEFORE 'portfolio:credits';--> statement-breakpoint
ALTER TYPE "auth"."permission_resource" ADD VALUE 'portfolio:credits-types' BEFORE 'portfolio:payments';--> statement-breakpoint
ALTER TYPE "auth"."permission_resource" ADD VALUE 'portfolio:payments-loans' BEFORE 'portfolio:products';--> statement-breakpoint
ALTER TYPE "auth"."permission_resource" ADD VALUE 'portfolio:payments-credits' BEFORE 'portfolio:products';