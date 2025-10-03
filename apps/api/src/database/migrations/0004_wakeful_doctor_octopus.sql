DROP VIEW "accounting"."account_balance";--> statement-breakpoint
CREATE VIEW "accounting"."account_balance" AS (
  SELECT
    ap.company_id AS tenant_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, 'VES') AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance
  FROM "accounting"."account_plan" ap
  LEFT JOIN "accounting"."accounting_entry_details" aed 
    ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
    ON ae.id = aed.accounting_entry_id
   AND ae.company_id  = ap.company_id 
   AND ae.status = 'POSTED'
  GROUP BY ap.company_id, ap.id, ap.code, ap.name, ap.nature, COALESCE(ae.currency_code, 'VES')
);