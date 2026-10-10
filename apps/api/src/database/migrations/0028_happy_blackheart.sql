DROP VIEW "savings"."associate_haberes_balance";--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD COLUMN "total_over_payment_liquidation" numeric(18, 4) NOT NULL;--> statement-breakpoint
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
          'SAVING_WITHDRAWAL','WITHDRAWAL_FEE_DEBIT','ADJUSTMENT_DEBIT',
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