CREATE VIEW "accounting"."active_account_balances_view" AS (
  SELECT
    ab.account_plan_id,
    ab.company_id,
    ab.accounting_cycles_id AS accounting_cycle_id,
    ap.code AS account_code,
    ap.name AS account_name,
    ap.nature,
    ab.initial_balance,
    COALESCE(pam.period_debit, 0) AS period_debit,
    COALESCE(pam.period_credit, 0) AS period_credit,
    CASE
      WHEN ap.nature = 'DEBIT' THEN
        (ab.initial_balance + COALESCE(pam.period_debit, 0) - COALESCE(pam.period_credit, 0))
      ELSE
        (ab.initial_balance + COALESCE(pam.period_credit, 0) - COALESCE(pam.period_debit, 0))
    END AS current_balance
  FROM accounting.account_balances ab
  INNER JOIN accounting.account_plan ap ON ab.account_plan_id = ap.id
  LEFT JOIN accounting.period_account_movements_view pam ON
    ab.account_plan_id = pam.account_plan_id AND ab.accounting_cycles_id = pam.accounting_cycle_id
);