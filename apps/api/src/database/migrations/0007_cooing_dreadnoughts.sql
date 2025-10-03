CREATE VIEW "accounting"."accounting_balance_by_bank" AS (
  SELECT
    ap.company_id AS tenant_id,
    ba.id AS bank_account_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, ba.currency_code) AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance
  FROM "banking"."bank_accounts" ba
  INNER JOIN "accounting"."account_plan" ap ON ap.id = ba.linked_chart_account_id
  LEFT JOIN "accounting"."accounting_entry_details" aed 
         ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
         ON ae.id = aed.accounting_entry_id
        AND ae.company_id = ap.company_id
        AND ae.status = 'POSTED'
  GROUP BY ap.company_id, ba.id, ap.id, ap.code, ap.name, ap.nature,
           COALESCE(ae.currency_code, ba.currency_code)
);