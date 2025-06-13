CREATE TABLE "savings_banks"."liquidations_associates" (
	"id" serial PRIMARY KEY NOT NULL,
	"associate_id" integer NOT NULL,
	"liquidation_date" date DEFAULT now() NOT NULL,
	"effective_date" date,
	"currency_code" "currency_code_enum" NOT NULL,
	"total_savings_balance_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_loans_at_liquidation" numeric(18, 4) NOT NULL,
	"total_outstanding_credits_at_liquidation" numeric(18, 4) NOT NULL,
	"net_liquidation_amount" numeric(18, 4) NOT NULL,
	"status" varchar(50) DEFAULT 'PROCESSED' NOT NULL,
	"payout_transaction_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_associate_id_associates_id_fk" FOREIGN KEY ("associate_id") REFERENCES "savings_banks"."associates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_banks"."liquidations_associates" ADD CONSTRAINT "liquidations_associates_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "liquidations_associate_liquidation_uidx" ON "savings_banks"."liquidations_associates" USING btree ("associate_id","liquidation_date");--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ALTER COLUMN "movement_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."associate_movement_type_enum";--> statement-breakpoint
CREATE TYPE "public"."associate_movement_type_enum" AS ENUM('SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'SAVING_WITHDRAWAL', 'WITHDRAWAL_FEE_DEBIT', 'LOAN_DISBURSEMENT_CREDIT', 'CREDIT_DISBURSEMENT_CREDIT', 'LOAN_PAYMENT_DEBIT', 'LOAN_INTEREST_DEBIT', 'LOAN_OVERPAYMENT_CREDIT', 'CREDIT_OVERPAYMENT_CREDIT', 'LOAN_FEE_DEBIT', 'DIVIDEND_CREDIT', 'FEE_REIMBURSEMENT_CREDIT', 'CREDIT_ADMIN_FEE_DEBIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'FEE_CORRECTION_DEBIT', 'OTHER_CREDIT', 'OTHER_DEBIT', 'FEE_DEBIT', 'ADMIN_FEE_DEBIT');--> statement-breakpoint
ALTER TABLE "savings_banks"."associate_account_movements" ALTER COLUMN "movement_type" SET DATA TYPE "public"."associate_movement_type_enum" USING "movement_type"::"public"."associate_movement_type_enum";--> statement-breakpoint
CREATE VIEW "savings_banks"."associate_account_balances" AS (
    SELECT
      aa.id AS associate_account_id,
      aa.associated_id,
      aa.account_number,
      aa.currency_code,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type IN (
            'SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'DIVIDEND_CREDIT', 
            'LOAN_DISBURSEMENT_CREDIT', 'OTHER_CREDIT', 'ADJUSTMENT_CREDIT', 
            'FEE_REIMBURSEMENT_CREDIT'
          ) THEN aam.amount
          WHEN aam.movement_type IN (
            'SAVING_WITHDRAWAL', 'LOAN_PAYMENT_DEBIT', 'FEE_DEBIT', 
            'WITHDRAWAL_FEE_DEBIT', 'LOAN_INTEREST_DEBIT', 'OTHER_DEBIT', 
            'ADJUSTMENT_DEBIT', 'FEE_CORRECTION_DEBIT'
          ) THEN -aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM
      "savings_banks"."associate_accounts" aa
    LEFT JOIN
      "savings_banks"."associate_account_movements" aam ON aa.id = aam.associate_account_id
    GROUP BY
      aa.id, aa.associated_id, aa.account_number, aa.currency_code
  );--> statement-breakpoint
CREATE VIEW "savings_banks"."associate_haberes_balance" AS (
  SELECT
      "savings_banks"."associate_account_movements"."associate_account_id",
      SUM(
          CASE
              -- Movimientos que SUMAN al Haber Patrimonial (Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" IN (
                  'SAVING_CONTRIBUTION',
                  'EMPLOYER_CONTRIBUTION',
                  'ADJUSTMENT_CREDIT',
                  'LOAN_OVERPAYMENT_CREDIT',
                  'CREDIT_OVERPAYMENT_CREDIT'
              ) THEN "savings_banks"."associate_account_movements"."amount"
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" IN (
                  'SAVING_WITHDRAWAL',
                  'WITHDRAWAL_FEE_DEBIT',
                  'ADJUSTMENT_DEBIT',
                  'FEE_CORRECTION_DEBIT'
              ) THEN -"savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ) AS haberes_balance,
      MAX("savings_banks"."associate_account_movements"."transaction_date") AS last_movement_date
  FROM
      "savings_banks"."associate_account_movements"
  GROUP BY
      "savings_banks"."associate_account_movements"."associate_account_id"
);--> statement-breakpoint
CREATE VIEW "savings_banks"."credit_outstanding_balance" AS (
  SELECT
    c.associate_id,
    c.currency_code,
    c.status AS credit_status,
    c.requested_amount,
    cas.principal_amount + cas.principal_balance_pending AS outstanding_principal_balance
  FROM
    "savings_banks"."credits" c
  JOIN
     "savings_banks"."credit_amortization_schedule" cas ON c.id = cas.credit_id
  WHERE
    c.status IN ('APPROVED', 'IN_PAYMENT') AND cas.payment_status IN ('PENDING', 'PARTIAL')
  GROUP BY c.id, c.associate_id, c.currency_code, c.status, c.requested_amount , cas.principal_amount,cas.installment_number, cas.principal_balance_pending
  ORDER BY cas.installment_number
  LIMIT 1
);--> statement-breakpoint
CREATE VIEW "savings_banks"."loan_outstanding_balance" AS (
  SELECT
    l.id AS loan_id,
    l.associate_id,
    l.currency_code,
    l.status AS loan_status,
    l.approved_amount,
    (las.principal_amount + las.principal_balance_pending) AS outstanding_principal_balance
  FROM
    "savings_banks"."loans" l
  JOIN
     "savings_banks"."loan_amortization_schedule" las ON l.id = las.loan_id
  WHERE
    l.status IN ('APPROVED', 'DISBURSED', 'IN_PAYMENT', 'OVERDUE')
    AND las.payment_status IN ('PENDING', 'PARTIAL')
  GROUP BY
    l.id, l.associate_id, l.currency_code, l.status, l.approved_amount, las.principal_amount, las.installment_number,las.principal_balance_pending
  ORDER BY las.installment_number asc
  LIMIT 1
);