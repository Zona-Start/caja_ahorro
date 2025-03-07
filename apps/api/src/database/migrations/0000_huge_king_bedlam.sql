CREATE SCHEMA "accounting";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "bank";
--> statement-breakpoint
CREATE SCHEMA "box";
--> statement-breakpoint
CREATE SCHEMA "estimate";
--> statement-breakpoint
CREATE TYPE "public"."nationality" AS ENUM('VENEZOLANO', 'EXTRANJERO');--> statement-breakpoint
CREATE TYPE "auth"."status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "accounting"."account_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"saving_bank_id" integer,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"parent_account_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "accounting"."movements_countable" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer,
	"account_plan_id" integer,
	"must" numeric(15, 2) DEFAULT '0',
	"credit" numeric(15, 2) DEFAULT '0',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "accounting"."transactions_countable" (
	"id" serial PRIMARY KEY NOT NULL,
	"savings_bank_id" integer,
	"transaction_type_id" integer,
	"date" date NOT NULL,
	"description" text,
	"reference" varchar(100),
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
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
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"user_id" integer,
	"role_id" integer,
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
CREATE TABLE "box"."accounts_associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"associated_id" integer,
	"balance" numeric(15, 2) DEFAULT '0',
	"account_number" numeric NOT NULL,
	"bank_id" integer NOT NULL,
	"opening_date" timestamp DEFAULT now(),
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "box"."associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"savings_bank_id" integer,
	"cedula" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"nationality" "nationality" NOT NULL,
	"date_admission" timestamp DEFAULT now() NOT NULL,
	"date_graduation" timestamp,
	"discount_frequency_id" integer,
	"status" "auth"."status" DEFAULT 'ACTIVE' NOT NULL,
	"is_payroll_credit" boolean DEFAULT false NOT NULL,
	"locality_id" integer,
	"phone" varchar(15),
	"email" varchar(100),
	"payroll_type_id" integer,
	"worker_type_id" integer,
	"charge" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "associates_cedula_unique" UNIQUE("cedula")
);
--> statement-breakpoint
CREATE TABLE "box"."savings_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rif" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"email" text NOT NULL,
	"person_contact" text,
	"phone_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "savings_bank_rif_unique" UNIQUE("rif"),
	CONSTRAINT "savings_bank_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"affected_table" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"record_id" integer NOT NULL,
	"user_id" integer,
	"details" jsonb,
	"date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "category_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"group" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"options" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"municipality_id" integer NOT NULL,
	"parish_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "localities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "municipalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "parishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"municipality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "transaction_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
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
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_saving_bank_id_savings_bank_id_fk" FOREIGN KEY ("saving_bank_id") REFERENCES "box"."savings_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."account_plan" ADD CONSTRAINT "account_plan_parent_account_id_account_plan_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "accounting"."account_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."movements_countable" ADD CONSTRAINT "movements_countable_transaction_id_transactions_countable_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "accounting"."transactions_countable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."movements_countable" ADD CONSTRAINT "movements_countable_account_plan_id_account_plan_id_fk" FOREIGN KEY ("account_plan_id") REFERENCES "accounting"."account_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."transactions_countable" ADD CONSTRAINT "transactions_countable_savings_bank_id_savings_bank_id_fk" FOREIGN KEY ("savings_bank_id") REFERENCES "box"."savings_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."transactions_countable" ADD CONSTRAINT "transactions_countable_transaction_type_id_transaction_types_id_fk" FOREIGN KEY ("transaction_type_id") REFERENCES "public"."transaction_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting"."transactions_countable" ADD CONSTRAINT "transactions_countable_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."roles_permissions" ADD CONSTRAINT "roles_permissions_permissions_id_permissions_id_fk" FOREIGN KEY ("permissions_id") REFERENCES "auth"."permissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box"."accounts_associates" ADD CONSTRAINT "accounts_associates_associated_id_associates_id_fk" FOREIGN KEY ("associated_id") REFERENCES "box"."associates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box"."associates" ADD CONSTRAINT "associates_savings_bank_id_savings_bank_id_fk" FOREIGN KEY ("savings_bank_id") REFERENCES "box"."savings_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box"."associates" ADD CONSTRAINT "associates_locality_id_states_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box"."associates" ADD CONSTRAINT "associates_payroll_type_id_category_type_id_fk" FOREIGN KEY ("payroll_type_id") REFERENCES "public"."category_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box"."associates" ADD CONSTRAINT "associates_worker_type_id_category_type_id_fk" FOREIGN KEY ("worker_type_id") REFERENCES "public"."category_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit" ADD CONSTRAINT "audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parishes" ADD CONSTRAINT "parishes_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."route_permissions" ADD CONSTRAINT "route_permissions_permissions_id_permissions_id_fk" FOREIGN KEY ("permissions_id") REFERENCES "auth"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_planx0" ON "accounting"."account_plan" USING btree ("code");--> statement-breakpoint
CREATE INDEX "account_planx1" ON "accounting"."account_plan" USING btree ("name");--> statement-breakpoint
CREATE INDEX "account_planx2" ON "accounting"."account_plan" USING btree ("type");--> statement-breakpoint
CREATE INDEX "movements_countablex0" ON "accounting"."movements_countable" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "movements_countablex1" ON "accounting"."movements_countable" USING btree ("account_plan_id");--> statement-breakpoint
CREATE INDEX "movements_countablex2" ON "accounting"."movements_countable" USING btree ("must");--> statement-breakpoint
CREATE INDEX "movements_countablex3" ON "accounting"."movements_countable" USING btree ("credit");--> statement-breakpoint
CREATE INDEX "transactions_countablex0" ON "accounting"."transactions_countable" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_countablex1" ON "accounting"."transactions_countable" USING btree ("description");--> statement-breakpoint
CREATE INDEX "transactions_countablex2" ON "accounting"."transactions_countable" USING btree ("transaction_type_id");--> statement-breakpoint
CREATE INDEX "transactions_countablex3" ON "accounting"."transactions_countable" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "activityLogs_idx" ON "activity_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "permissions_idx" ON "auth"."permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_idx" ON "auth"."roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_permission_idx01" ON "auth"."roles_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "roles_permission_idx02" ON "auth"."roles_permissions" USING btree ("permissions_id");--> statement-breakpoint
CREATE INDEX "sessions_idx" ON "auth"."sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "users_idx" ON "auth"."users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "auth"."user_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_associatesx0" ON "box"."accounts_associates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "accounts_associatesx1" ON "box"."accounts_associates" USING btree ("balance");--> statement-breakpoint
CREATE INDEX "accounts_associatesx2" ON "box"."accounts_associates" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "accounts_associatesx3" ON "box"."accounts_associates" USING btree ("opening_date");--> statement-breakpoint
CREATE INDEX "associates_index0" ON "box"."associates" USING btree ("cedula");--> statement-breakpoint
CREATE INDEX "associates_index1" ON "box"."associates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "associates_index2" ON "box"."associates" USING btree ("date_admission");--> statement-breakpoint
CREATE INDEX "associates_index3" ON "box"."associates" USING btree ("date_graduation");--> statement-breakpoint
CREATE INDEX "associates_index4" ON "box"."associates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "associates_index5" ON "box"."associates" USING btree ("is_payroll_credit");--> statement-breakpoint
CREATE INDEX "associates_index6" ON "box"."associates" USING btree ("payroll_type_id");--> statement-breakpoint
CREATE INDEX "associates_index7" ON "box"."associates" USING btree ("worker_type_id");--> statement-breakpoint
CREATE INDEX "associates_index8" ON "box"."associates" USING btree ("locality_id");--> statement-breakpoint
CREATE INDEX "savings_bank_idx0" ON "box"."savings_bank" USING btree ("name");--> statement-breakpoint
CREATE INDEX "savings_bank_idx1" ON "box"."savings_bank" USING btree ("rif");--> statement-breakpoint
CREATE INDEX "category_typeIx0" ON "category_type" USING btree ("group");--> statement-breakpoint
CREATE INDEX "category_typeIx1" ON "category_type" USING btree ("description");--> statement-breakpoint
CREATE INDEX "category_typeIx2" ON "category_type" USING btree ("options");--> statement-breakpoint
CREATE UNIQUE INDEX "localities_index_03" ON "localities" USING btree ("state_id","municipality_id","parish_id");--> statement-breakpoint
CREATE INDEX "localities_index_00" ON "localities" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "localities_index_01" ON "localities" USING btree ("municipality_id");--> statement-breakpoint
CREATE INDEX "localities_index_02" ON "localities" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "municipalities_index_00" ON "municipalities" USING btree ("id","name","state_id");--> statement-breakpoint
CREATE INDEX "parishes_index_00" ON "parishes" USING btree ("id","name","municipality_id");--> statement-breakpoint
CREATE INDEX "states_index_00" ON "states" USING btree ("id","name");--> statement-breakpoint
CREATE INDEX "route_permissions_idx" ON "auth"."route_permissions" USING btree ("route");--> statement-breakpoint
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