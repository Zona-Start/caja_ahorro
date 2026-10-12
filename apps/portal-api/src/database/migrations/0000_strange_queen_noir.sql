CREATE SCHEMA "portal";
--> statement-breakpoint
CREATE TYPE "portal"."access_event" AS ENUM('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'READ', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'OTP_SENT');--> statement-breakpoint
CREATE TYPE "portal"."account_status" AS ENUM('PENDING_ACTIVATION', 'ACTIVE', 'LOCKED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "portal"."email_status" AS ENUM('QUEUED', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "portal"."otp_purpose" AS ENUM('EMAIL_VERIFY', 'PHONE_VERIFY', 'RESET', 'STEP_UP');--> statement-breakpoint
CREATE TABLE "portal"."access_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_id" uuid,
	"tenant_id" uuid,
	"event" "portal"."access_event" NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"correlation_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"username" varchar(20) NOT NULL,
	"password_hash" text NOT NULL,
	"status" "portal"."account_status" DEFAULT 'PENDING_ACTIVATION' NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"email" varchar(100),
	"phone" varchar(50),
	"email_verified_at" timestamp,
	"phone_verified_at" timestamp,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login_at" timestamp,
	"password_changed_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "portal"."associate_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"address" text,
	"locality_id" integer,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "associate_profile_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "portal"."email_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_id" uuid,
	"template" varchar(50) NOT NULL,
	"to_address" varchar(100) NOT NULL,
	"provider_id" varchar(100),
	"status" "portal"."email_status" DEFAULT 'QUEUED' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal"."otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"purpose" "portal"."otp_purpose" NOT NULL,
	"destination" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"correlation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"refresh_token_expires_at" timestamp NOT NULL,
	"previous_refresh_token_hash" text,
	"last_rotated_at" timestamp,
	"rotation_count" integer DEFAULT 0 NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" text,
	"correlation_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "portal_access_log_account_idx" ON "portal"."access_log" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "portal_access_log_event_idx" ON "portal"."access_log" USING btree ("event");--> statement-breakpoint
CREATE INDEX "portal_access_log_created_idx" ON "portal"."access_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "portal_accounts_tenant_associate_uidx" ON "portal"."accounts" USING btree ("tenant_id","associate_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "portal_accounts_tenant_username_uidx" ON "portal"."accounts" USING btree ("tenant_id","username") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "portal_accounts_tenant_idx" ON "portal"."accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "portal_accounts_status_idx" ON "portal"."accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_associate_profile_tenant_idx" ON "portal"."associate_profile" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "portal_email_log_account_idx" ON "portal"."email_log" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "portal_email_log_status_idx" ON "portal"."email_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_otp_account_purpose_idx" ON "portal"."otp_codes" USING btree ("account_id","purpose");--> statement-breakpoint
CREATE INDEX "portal_otp_expires_idx" ON "portal"."otp_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "portal_sessions_account_idx" ON "portal"."sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "portal_sessions_token_hash_idx" ON "portal"."sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "portal_sessions_is_active_idx" ON "portal"."sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "portal_sessions_correlation_idx" ON "portal"."sessions" USING btree ("correlation_id");