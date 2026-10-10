CREATE TYPE "savings"."reimbursement_destination" AS ENUM('SAVINGS', 'CASH');--> statement-breakpoint
CREATE TYPE "savings"."reimbursement_origin_type" AS ENUM('LOAN', 'CREDIT', 'WITHDRAWAL');--> statement-breakpoint
CREATE TYPE "savings"."reimbursements_status" AS ENUM('REQUESTED', 'APPROVED', 'PROCESSED', 'DISBURSED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "savings"."reimbursement_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reimbursement_id" uuid NOT NULL,
	"origin_type" "savings"."reimbursement_origin_type" NOT NULL,
	"origin_id" uuid,
	"origin_reference" varchar(50),
	"amount" numeric(20, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "savings"."reimbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"associate_account_id" uuid,
	"currency_code" "currency_code" NOT NULL,
	"destination" "savings"."reimbursement_destination" NOT NULL,
	"total_amount" numeric(20, 6) NOT NULL,
	"status" "savings"."reimbursements_status" DEFAULT 'REQUESTED' NOT NULL,
	"bank_id" uuid,
	"transaction_reference" varchar(100),
	"comment" text,
	"custom_reference" varchar(50),
	"approved_by_id" uuid,
	"processed_by_id" uuid,
	"disbursed_by_id" uuid,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"disbursed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
DROP VIEW "savings"."associate_account_balances";--> statement-breakpoint
DROP VIEW "savings"."associate_haberes_balance";--> statement-breakpoint
ALTER TABLE "savings"."reimbursement_details" ADD CONSTRAINT "reimbursement_details_reimbursement_id_reimbursements_id_fk" FOREIGN KEY ("reimbursement_id") REFERENCES "savings"."reimbursements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_associate_account_id_associate_accounts_id_fk" FOREIGN KEY ("associate_account_id") REFERENCES "savings"."associate_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_bank_id_bank_directory_id_fk" FOREIGN KEY ("bank_id") REFERENCES "treasury"."bank_directory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_processed_by_id_users_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings"."reimbursements" ADD CONSTRAINT "reimbursements_disbursed_by_id_users_id_fk" FOREIGN KEY ("disbursed_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reimbursement_details_reimbursement_idx" ON "savings"."reimbursement_details" USING btree ("reimbursement_id");--> statement-breakpoint
CREATE INDEX "reimbursements_associate_idx" ON "savings"."reimbursements" USING btree ("associate_id");--> statement-breakpoint
CREATE INDEX "reimbursements_status_idx" ON "savings"."reimbursements" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reimbursements_reference_uidx" ON "savings"."reimbursements" USING btree ("custom_reference");--> statement-breakpoint
CREATE VIEW "savings"."associate_account_balances" AS (
    SELECT
      a.tenant_id AS tenant_id,
      aa.id AS associate_account_id,
      aa.associate_id,
      aa.account_number,
      aa.currency_code,
      aa.status,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type IN (
            'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION','SURPLUS_SAVINGS_CONTRIBUTION',
            'LOAN_DISBURSEMENT_CREDIT','SPECIAL_LOAN_DISBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT','SPECIAL_CREDIT_DISBURSEMENT_CREDIT',
            'LOAN_REFINANCING_CREDIT','LOAN_REIMBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT','LOAN_OVERPAYMENT_CREDIT',
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT','LOAN_PARTIAL_DISBURSEMENT_CREDIT',
            'DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT','ADJUSTMENT_CREDIT','OTHER_CREDIT'
          ) THEN aam.amount
          WHEN aam.movement_type IN (
            'SAVING_WITHDRAWAL','LOAN_REFINANCING_DEBIT','LOAN_PAYMENT_DEBIT',
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT','WITHDRAWAL_FEE_DEBIT',
            'LOAN_INTEREST_DEBIT','LOAN_FEE_DEBIT','LOAN_ADMIN_FEE_DEBIT',
            'LATE_PAYMENT_FEE_DEBIT','PAYMENT_REVERSAL_DEBIT',
            'CREDIT_ADMIN_FEE_DEBIT','FEE_CORRECTION_DEBIT',
            'ADMIN_FEE_DEBIT','OTHER_DEBIT','FEE_DEBIT'
          ) THEN -aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM "savings"."associate_accounts" aa
    INNER JOIN "savings"."associates" a ON aa.associate_id = a.id
    LEFT JOIN "savings"."associate_account_movements" aam
      ON aa.id = aam.associate_account_id AND aam.status = 'COMPLETED'
    GROUP BY a.tenant_id, aa.id, aa.associate_id, aa.account_number, aa.currency_code
  );--> statement-breakpoint
CREATE VIEW "savings"."associate_haberes_balance" AS (
  SELECT
    associate_account_id,
    COALESCE(SUM(amount_change), 0) AS haberes_balance,
    MAX(transaction_date) AS last_movement_date,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_CONTRIBUTION'), 0) AS haberes_contribution,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'VOLUNTARY_SAVINGS'), 0) AS haberes_voluntary,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SURPLUS_SAVINGS_CONTRIBUTION'), 0) AS haberes_surplus_contribution,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'EMPLOYER_CONTRIBUTION'), 0) AS haberes_employer,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'DIVIDEND_CREDIT'), 0) AS surpluses,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_WITHDRAWAL'), 0) AS total_withdrawals,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'WITHDRAWAL_FEE_DEBIT'), 0) AS total_withdrawal_fees,
    COALESCE(SUM(amount_change) FILTER (
    	WHERE movement_type IN (
    	'SAVING_WITHDRAWAL_REVERSAL_CREDIT',
    	'LOAN_PAYMENT_REVERSAL_CREDIT',
    	'CREDIT_PAYMENT_REVERSAL_CREDIT'
    	) 
    ), 0) AS total_overpayment
  FROM (
    SELECT
      associate_account_id,
      movement_type,
      CASE
        WHEN movement_type IN (
          'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION','SURPLUS_SAVINGS_CONTRIBUTION',
          'ADJUSTMENT_CREDIT','DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT',
          'LOAN_OVERPAYMENT_CREDIT','COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',
          'SAVING_WITHDRAWAL_REVERSAL_CREDIT','LIQUIDATION_BALANCE_REVERSAL_CREDIT',
          'ACCOUNTING_ADJUSTMENT_CREDIT','OTHER_CREDIT', 'LOAN_PAYMENT_REVERSAL_CREDIT','CREDIT_PAYMENT_REVERSAL_CREDIT'
        ) THEN amount
        WHEN movement_type IN (
          'SAVING_WITHDRAWAL','WITHDRAWAL_FEE_DEBIT',
          'FEE_CORRECTION_DEBIT','PAYMENT_REVERSAL_DEBIT','ADMIN_FEE_DEBIT',
          'OTHER_DEBIT','FEE_DEBIT','LIQUIDATION_BALANCE',
          'ACCOUNTING_ADJUSTMENT_DEBIT','LIQUIDATION_LOAN_PAYMENT_DEBIT',
          'LIQUIDATION_CREDIT_PAYMENT_DEBIT','LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT',
          'LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT','LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT'
        ) THEN -amount
        ELSE 0
      END AS amount_change,
      transaction_date
    FROM "savings"."associate_account_movements"
    WHERE status = 'COMPLETED'
  ) sub
  GROUP BY associate_account_id
);