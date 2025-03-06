CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TYPE "auth"."status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."roles_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer,
	"permissions_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."route_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"route" text NOT NULL,
	"permissions_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"code" integer,
	"expires" timestamp NOT NULL,
	"ip_address" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"fullname" text NOT NULL,
	"phone" text,
	"password" text NOT NULL,
	"is_two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth"."user_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"role_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_permissions_id_permissions_id_fk" FOREIGN KEY ("permissions_id") REFERENCES "auth"."permissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."route_permissions" ADD CONSTRAINT "route_permissions_permissions_id_permissions_id_fk" FOREIGN KEY ("permissions_id") REFERENCES "auth"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activityLogs_idx" ON "activity_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "permissions_idx" ON "auth"."permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_idx" ON "auth"."roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_permission_idx01" ON "auth"."roles_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "roles_permission_idx02" ON "auth"."roles_permissions" USING btree ("permissions_id");--> statement-breakpoint
CREATE INDEX "route_permissions_idx" ON "auth"."route_permissions" USING btree ("route");--> statement-breakpoint
CREATE INDEX "sessions_idx" ON "auth"."sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "users_idx" ON "auth"."users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "auth"."user_role" USING btree ("user_id");--> statement-breakpoint
CREATE VIEW "auth"."user_access_view" AS (
   SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.fullname,
    r.id AS role_id,
    r.name AS role_name,
    p.id AS permission_id,
    p.name AS permission_name,
    rp.route
FROM
  auth.users u
LEFT JOIN
  auth.user_role ur ON u.id = ur.user_id 
LEFT JOIN
  auth.roles r ON ur.role_id  = r.id
LEFT JOIN
  auth.permissions p ON r.id = (SELECT rp2.permissions_id  FROM auth.route_permissions rp2 WHERE rp2.permissions_id  = p.id)
LEFT JOIN
  auth.route_permissions rp ON p.id = rp.permissions_id );