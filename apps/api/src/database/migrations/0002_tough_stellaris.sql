DROP VIEW "savings_banks"."associate_account_balances";--> statement-breakpoint
DROP VIEW "savings_banks"."associate_haberes_balance";--> statement-breakpoint
CREATE VIEW "savings_banks"."associate_account_balances" AS (
    SELECT
      aa.id AS associate_account_id,
      aa.associated_id,
      aa.account_number,
      aa.currency_code,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
            'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
            'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
            'LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_PARTIAL_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
            'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
            'OTHER_CREDIT'::public.associate_movement_type_enum
          ]) THEN aam.amount
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_DEBIT'::public.associate_movement_type_enum,
            'LOAN_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_INTEREST_DEBIT'::public.associate_movement_type_enum,
            'LOAN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LATE_PAYMENT_FEE_DEBIT'::public.associate_movement_type_enum,
            'PAYMENT_REVERSAL_DEBIT'::public.associate_movement_type_enum,
            'CREDIT_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
            'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
            'ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'OTHER_DEBIT'::public.associate_movement_type_enum,
            'FEE_DEBIT'::public.associate_movement_type_enum
          ]) THEN - aam.amount
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
      -- Saldo total de haberes (la suma y resta de todos los movimientos que componen el haber)
      SUM(
          CASE
              -- Movimientos que SUMAN al Haber Patrimonial (Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" = ANY (ARRAY[
                  'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
                  'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
                  'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
                  'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
                  'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
                  'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
                  'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum
              ]) THEN "savings_banks"."associate_account_movements"."amount"
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" = ANY (ARRAY[
                  'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
                  'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
                  'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
                  'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum
              ]) THEN -"savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ) AS haberes_balance,
      MAX("savings_banks"."associate_account_movements"."transaction_date") AS last_movement_date,

      -- --- Nuevas columnas de desglose ---
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'SAVING_CONTRIBUTION'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_contribution,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_voluntary,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS haberes_employer,
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'DIVIDEND_CREDIT'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS surpluses
      -- --- Fin de nuevas columnas ---

  FROM
      "savings_banks"."associate_account_movements"
  GROUP BY
      "savings_banks"."associate_account_movements"."associate_account_id"
);