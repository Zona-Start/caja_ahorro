DROP VIEW "savings_banks"."associate_haberes_balance";--> statement-breakpoint
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

      -- --- Columnas de desglose ---
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
      ), 0) AS surpluses,
      -- Nueva columna para la suma de todos los retiros
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'SAVING_WITHDRAWAL'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS total_withdrawals,
      -- Nueva columna para la suma de todos los gastos administrativos por retiros
      COALESCE(SUM(
          CASE
              WHEN "savings_banks"."associate_account_movements"."movement_type" = 'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum THEN "savings_banks"."associate_account_movements"."amount"
              ELSE 0
          END
      ), 0) AS total_withdrawal_fees
  FROM
      "savings_banks"."associate_account_movements"
  GROUP BY
      "savings_banks"."associate_account_movements"."associate_account_id"
);