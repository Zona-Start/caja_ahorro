ALTER TABLE "inventory"."inventory_movements" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD COLUMN "movement_date" date DEFAULT now();--> statement-breakpoint
ALTER TABLE "inventory"."inventory_movements" ADD COLUMN "movement_number" varchar(50) NOT NULL;