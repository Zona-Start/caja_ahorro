CREATE VIEW "accounting"."period_account_movements_view" AS (
  SELECT
    aed.account_plan_id,
    ae.accounting_cycle_id,
    COALESCE(SUM(aed.debit), 0) AS period_debit,
    COALESCE(SUM(aed.credit), 0) AS period_credit
  FROM accounting.accounting_entry_details aed
  INNER JOIN accounting.accounting_entries ae ON aed.accounting_entry_id = ae.id
  WHERE ae.status = 'POSTED'
  GROUP BY aed.account_plan_id, ae.accounting_cycle_id
);