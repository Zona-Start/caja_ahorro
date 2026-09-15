DROP INDEX "auth"."permissions_resource_action_scope_idx";--> statement-breakpoint
DROP INDEX "auth"."roles_tenant_name_idx";--> statement-breakpoint
DROP INDEX "auth"."users_username_idx";--> statement-breakpoint
DROP INDEX "auth"."users_email_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_resource_action_scope_active_idx" ON "auth"."permissions" USING btree ("resource","action","scope") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_tenant_name_active_idx" ON "auth"."roles" USING btree ("tenant_id","name") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_active_idx" ON "auth"."users" USING btree ("username") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_active_idx" ON "auth"."users" USING btree ("email") WHERE deleted_at IS NULL;