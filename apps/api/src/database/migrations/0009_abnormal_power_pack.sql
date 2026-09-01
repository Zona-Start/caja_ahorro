DROP VIEW "savings"."associate_account_balances";--> statement-breakpoint
DROP VIEW "savings"."associate_haberes_balance";--> statement-breakpoint
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
            'CREDIT_ADMIN_FEE_DEBIT','ADJUSTMENT_DEBIT','FEE_CORRECTION_DEBIT',
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
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'WITHDRAWAL_FEE_DEBIT'), 0) AS total_withdrawal_fees
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
          'ACCOUNTING_ADJUSTMENT_CREDIT','OTHER_CREDIT'
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