CREATE TABLE "savings_banks"."credit_item_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_id" integer NOT NULL,
	"item_type" varchar NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"agreed_selling_price" numeric(20, 6) NOT NULL,
	"sale_date" date DEFAULT now() NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'ENTREGADO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
DROP TABLE "savings_banks"."credit_product_sales" CASCADE;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_credit_id_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "savings_banks"."credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."credit_item_sales" ADD CONSTRAINT "credit_item_sales_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_item_sale_credit_id_idx" ON "savings_banks"."credit_item_sales" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "credit_item_sale_type_idx" ON "savings_banks"."credit_item_sales" USING btree ("item_type");