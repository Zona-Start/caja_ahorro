DROP VIEW "savings_banks"."associate_haberes_balance";--> statement-breakpoint
DROP VIEW "savings_banks"."loan_outstanding_balance";--> statement-breakpoint
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
                  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'SAVING_WITHDRAWAL_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_CREDIT'::associate_movement_type_enum,
                  'OTHER_CREDIT'::associate_movement_type_enum
              ]) THEN "savings_banks"."associate_account_movements"."amount"
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN "savings_banks"."associate_account_movements"."movement_type" = ANY (ARRAY[
                  'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
                  'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
                  'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
                  'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
                  'PAYMENT_REVERSAL_DEBIT'::associate_movement_type_enum, -- Aunque es "PAYMENT", podría ser una reversión de pago de algo no crediticio
                  'ADMIN_FEE_DEBIT'::associate_movement_type_enum,
                  'OTHER_DEBIT'::associate_movement_type_enum,
                  'FEE_DEBIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_DEBIT'::associate_movement_type_enum
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
);--> statement-breakpoint
CREATE VIEW "savings_banks"."loan_outstanding_balance" AS (
  SELECT
      l.id AS loan_id,
      l.associate_id,
      l.currency_code,
      l.status AS loan_status,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) AS total_principal_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS total_interest_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) +
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS outstanding_total_balance
  FROM
      "savings_banks"."loans" l
  JOIN
      "savings_banks"."loan_amortization_schedule" las ON l.id = las.loan_id
  WHERE
      l.status IN ('DISBURSED'::loan_status_enum, 'IN_PAYMENT'::loan_status_enum, 'OVERDUE'::loan_status_enum)
  GROUP BY
      l.id,
      l.associate_id,
      l.currency_code,
      l.status
);