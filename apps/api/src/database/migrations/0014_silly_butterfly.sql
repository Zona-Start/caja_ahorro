CREATE TABLE "savings"."contribution_batch_associates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_batch_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"amount" numeric(20, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "savings"."contribution_batch_associates" ADD CONSTRAINT "contribution_batch_associates_contribution_batch_id_contribution_batches_id_fk" FOREIGN KEY ("contribution_batch_id") REFERENCES "savings"."contribution_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batch_associates" ADD CONSTRAINT "contribution_batch_associates_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrib_batch_assoc_batch_idx" ON "savings"."contribution_batch_associates" USING btree ("contribution_batch_id");--> statement-breakpoint
CREATE INDEX "contrib_batch_assoc_associate_idx" ON "savings"."contribution_batch_associates" USING btree ("associate_id");