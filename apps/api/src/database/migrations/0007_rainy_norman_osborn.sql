DROP VIEW "accounting"."mv_account_balances";--> statement-breakpoint
CREATE VIEW "accounting"."mv_account_balances" AS (
  SELECT
    ap.tenant_id,
    ae.accounting_cycle_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    ap.account_type,
    ap.nature AS account_nature,
    ap.level,
    ap.parent_account_id,
    ap.allows_movements,
    COALESCE(SUM(acd.debit), 0) AS total_debit,
    COALESCE(SUM(acd.credit), 0) AS total_credit,
    CASE 
        WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(acd.debit - acd.credit), 0)
        WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(acd.credit - acd.debit), 0)
        ELSE COALESCE(SUM(acd.debit - acd.credit), 0)
    END AS final_balance
  FROM "accounting"."account_plan" ap
  INNER JOIN "accounting"."accounting_entry_details" acd ON ap.id = acd.account_plan_id
  INNER JOIN "accounting"."accounting_entries" ae 
    ON acd.accounting_entry_id = ae.id 
   AND ae.tenant_id = ap.tenant_id
  WHERE ae.status = 'POSTED'
  GROUP BY 
    ap.tenant_id, 
    ae.accounting_cycle_id, 
    ap.id, 
    ap.code, 
    ap.name, 
    ap.account_type, 
    ap.nature, 
    ap.level, 
    ap.parent_account_id, 
    ap.allows_movements
);