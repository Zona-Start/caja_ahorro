CREATE TYPE "public"."login_mode" AS ENUM('CUSTOM_DOMAIN', 'SUBDOMAIN');--> statement-breakpoint
CREATE TABLE "tenant"."tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid,
	CONSTRAINT "tenant_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "slug" varchar(63);--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "logo_key" text;--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "favicon_key" text;--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "primary_color" varchar(9);--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "secondary_color" varchar(9);--> statement-breakpoint
ALTER TABLE "tenant"."tenants" ADD COLUMN "login_mode" "login_mode" DEFAULT 'SUBDOMAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant"."tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_domains_tenant_idx" ON "tenant"."tenant_domains" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_domains_domain_idx" ON "tenant"."tenant_domains" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenant"."tenants" USING btree ("slug");