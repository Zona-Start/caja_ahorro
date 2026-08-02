DROP VIEW "savings"."associate_account_balances";--> statement-breakpoint
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
            'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION',
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
  );