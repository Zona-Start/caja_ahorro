DROP VIEW "accounting"."accounting_balance";--> statement-breakpoint
DROP VIEW "accounting"."accounting_balance_by_bank";--> statement-breakpoint
DROP VIEW "accounting"."active_account_balances_view";--> statement-breakpoint
DROP VIEW "accounting"."mv_account_balances";--> statement-breakpoint
DROP VIEW "accounting"."period_account_movements_view";--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" DROP CONSTRAINT "amount_positive_check";--> statement-breakpoint
DROP INDEX "core"."exchange_rates_date_idx";--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "initial_balance" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "debit_balance" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "credit_balance" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ALTER COLUMN "final_balance" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ALTER COLUMN "debit" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ALTER COLUMN "credit" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "sales"."customer_payments" ALTER COLUMN "exchange_rate" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "sales"."customer_payments" ALTER COLUMN "exchange_rate" SET DEFAULT '1.000000';--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ALTER COLUMN "rate" SET DATA TYPE numeric(14, 6) USING rate::numeric(14, 6);--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ALTER COLUMN "exchange_rate" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ALTER COLUMN "exchange_rate" SET DEFAULT '1.000000';--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ALTER COLUMN "exchange_rate" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ALTER COLUMN "exchange_rate" SET DEFAULT '1.000000';--> statement-breakpoint
ALTER TABLE "sales"."sales_quotes" ALTER COLUMN "exchange_rate" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "sales"."sales_quotes" ALTER COLUMN "exchange_rate" SET DEFAULT '1.000000';--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "initial_balance_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "debit_balance_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "credit_balance_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "final_balance_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "initial_balance_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "debit_balance_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "credit_balance_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "final_balance_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "accounting"."account_balances" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entries" ADD COLUMN "base_currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "debit_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "credit_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "debit_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "credit_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."accounts_payable" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."associate_account_movements" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."contribution_batches" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_amortization_schedule" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credit_payments" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."credits" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."customer_payments" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."customer_payments" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ADD COLUMN "rate_date" date;--> statement-breakpoint
UPDATE "core"."exchange_rates" SET "rate_date" = "fetched_at"::date WHERE "rate_date" IS NULL;--> statement-breakpoint
ALTER TABLE "core"."exchange_rates" ALTER COLUMN "rate_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."liquidations_associates" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_amortization_schedule" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loan_payments" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."loans" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."payment_batches" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."purchase_orders" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_invoices" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_orders" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_quotes" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales"."sales_quotes" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_invoices" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_payments" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchasing"."supplier_transactions" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "currency_code" "currency_code" DEFAULT 'VES' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "exchange_rate" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "amount_base" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "savings"."withdrawals_associates" ADD COLUMN "amount_foreign" numeric(18, 4) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_currency_rate_date_uidx" ON "core"."exchange_rates" USING btree ("currency_id","rate_date");--> statement-breakpoint
CREATE INDEX "exchange_rates_date_idx" ON "core"."exchange_rates" USING btree ("rate_date");--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "base_foreign_direction_check" CHECK ((
        ("accounting"."accounting_entry_details"."debit_base" > 0 AND "accounting"."accounting_entry_details"."credit_base" = 0 AND "accounting"."accounting_entry_details"."debit_foreign" > 0 AND "accounting"."accounting_entry_details"."credit_foreign" = 0)
        OR ("accounting"."accounting_entry_details"."credit_base" > 0 AND "accounting"."accounting_entry_details"."debit_base" = 0 AND "accounting"."accounting_entry_details"."credit_foreign" > 0 AND "accounting"."accounting_entry_details"."debit_foreign" = 0)
        OR ("accounting"."accounting_entry_details"."debit_base" = 0 AND "accounting"."accounting_entry_details"."credit_base" = 0 AND "accounting"."accounting_entry_details"."debit_foreign" = 0 AND "accounting"."accounting_entry_details"."credit_foreign" = 0)
      ));--> statement-breakpoint
ALTER TABLE "accounting"."accounting_entry_details" ADD CONSTRAINT "amount_positive_check" CHECK ("accounting"."accounting_entry_details"."debit" >= 0 AND "accounting"."accounting_entry_details"."credit" >= 0 AND "accounting"."accounting_entry_details"."debit_base" >= 0 AND "accounting"."accounting_entry_details"."credit_base" >= 0 AND "accounting"."accounting_entry_details"."debit_foreign" >= 0 AND "accounting"."accounting_entry_details"."credit_foreign" >= 0);--> statement-breakpoint
CREATE VIEW "accounting"."period_account_movements_view" AS (
  SELECT
    aed.account_plan_id,
    ae.accounting_cycle_id,
    COALESCE(SUM(aed.debit), 0) AS period_debit,
    COALESCE(SUM(aed.credit), 0) AS period_credit,
    COALESCE(SUM(aed.debit_base), 0) AS period_debit_base,
    COALESCE(SUM(aed.credit_base), 0) AS period_credit_base,
    COALESCE(SUM(aed.debit_foreign), 0) AS period_debit_foreign,
    COALESCE(SUM(aed.credit_foreign), 0) AS period_credit_foreign
  FROM "accounting"."accounting_entry_details" aed
  INNER JOIN "accounting"."accounting_entries" ae ON aed.accounting_entry_id = ae.id
  WHERE ae.status = 'POSTED'
  GROUP BY aed.account_plan_id, ae.accounting_cycle_id
);
CREATE VIEW "accounting"."accounting_balance" AS (
  SELECT
    ap.tenant_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, 'VES') AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    COALESCE(SUM(aed.debit_base), 0) AS total_debit_base,
    COALESCE(SUM(aed.credit_base), 0) AS total_credit_base,
    COALESCE(SUM(aed.debit_foreign), 0) AS total_debit_foreign,
    COALESCE(SUM(aed.credit_foreign), 0) AS total_credit_foreign,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit_base - aed.credit_base), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit_base - aed.debit_base), 0)
      ELSE 0
    END AS balance_base,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit_foreign - aed.credit_foreign), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit_foreign - aed.debit_foreign), 0)
      ELSE 0
    END AS balance_foreign
  FROM "accounting"."account_plan" ap
  LEFT JOIN "accounting"."accounting_entry_details" aed ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ap.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ap.tenant_id, ap.id, ap.code, ap.name, ap.nature, COALESCE(ae.currency_code, 'VES')
);--> statement-breakpoint
CREATE VIEW "accounting"."accounting_balance_by_bank" AS (
  SELECT
    ba.tenant_id,
    ba.id AS bank_account_id,
    ap.id AS account_plan_id,
    ap.code AS account_code,
    ap.name AS account_name,
    COALESCE(ae.currency_code, ba.currency_code) AS currency_code,
    COALESCE(SUM(aed.debit), 0) AS total_debit,
    COALESCE(SUM(aed.credit), 0) AS total_credit,
    COALESCE(SUM(aed.debit_base), 0) AS total_debit_base,
    COALESCE(SUM(aed.credit_base), 0) AS total_credit_base,
    COALESCE(SUM(aed.debit_foreign), 0) AS total_debit_foreign,
    COALESCE(SUM(aed.credit_foreign), 0) AS total_credit_foreign,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit - aed.credit), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit - aed.debit), 0)
      ELSE 0
    END AS balance,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit_base - aed.credit_base), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit_base - aed.debit_base), 0)
      ELSE 0
    END AS balance_base,
    CASE 
      WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(aed.debit_foreign - aed.credit_foreign), 0)
      WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(aed.credit_foreign - aed.debit_foreign), 0)
      ELSE 0
    END AS balance_foreign
  FROM "treasury"."bank_accounts" ba
  INNER JOIN "accounting"."account_plan" ap ON ap.id = ba.linked_chart_account_id
  LEFT JOIN "accounting"."accounting_entry_details" aed ON aed.account_plan_id = ap.id
  LEFT JOIN "accounting"."accounting_entries" ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ba.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ba.tenant_id, ba.id, ap.id, ap.code, ap.name, ap.nature,
           COALESCE(ae.currency_code, ba.currency_code)
);--> statement-breakpoint
CREATE VIEW "accounting"."active_account_balances_view" AS (
  SELECT
    ab.account_plan_id,
    ab.tenant_id,
    ab.accounting_cycles_id AS accounting_cycle_id,
    ap.code AS account_code,
    ap.name AS account_name,
    ap.nature,
    ab.initial_balance,
    COALESCE(pam.period_debit, 0) AS period_debit,
    COALESCE(pam.period_credit, 0) AS period_credit,
    COALESCE(pam.period_debit_base, 0) AS period_debit_base,
    COALESCE(pam.period_credit_base, 0) AS period_credit_base,
    COALESCE(pam.period_debit_foreign, 0) AS period_debit_foreign,
    COALESCE(pam.period_credit_foreign, 0) AS period_credit_foreign,
    CASE
      WHEN ap.nature = 'DEBIT' THEN (ab.initial_balance + COALESCE(pam.period_debit, 0) - COALESCE(pam.period_credit, 0))
      WHEN ap.nature = 'CREDIT' THEN (ab.initial_balance + COALESCE(pam.period_credit, 0) - COALESCE(pam.period_debit, 0))
      ELSE 0
    END AS current_balance,
    CASE
      WHEN ap.nature = 'DEBIT' THEN (ab.initial_balance_base + COALESCE(pam.period_debit_base, 0) - COALESCE(pam.period_credit_base, 0))
      WHEN ap.nature = 'CREDIT' THEN (ab.initial_balance_base + COALESCE(pam.period_credit_base, 0) - COALESCE(pam.period_debit_base, 0))
      ELSE 0
    END AS current_balance_base,
    CASE
      WHEN ap.nature = 'DEBIT' THEN (ab.initial_balance_foreign + COALESCE(pam.period_debit_foreign, 0) - COALESCE(pam.period_credit_foreign, 0))
      WHEN ap.nature = 'CREDIT' THEN (ab.initial_balance_foreign + COALESCE(pam.period_credit_foreign, 0) - COALESCE(pam.period_debit_foreign, 0))
      ELSE 0
    END AS current_balance_foreign
  FROM "accounting"."account_balances" ab
  INNER JOIN "accounting"."account_plan" ap ON ab.account_plan_id = ap.id
  LEFT JOIN "accounting"."period_account_movements_view" pam
    ON ab.account_plan_id = pam.account_plan_id AND ab.accounting_cycles_id = pam.accounting_cycle_id
);--> statement-breakpoint
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
    COALESCE(SUM(acd.debit_base), 0) AS total_debit_base,
    COALESCE(SUM(acd.credit_base), 0) AS total_credit_base,
    COALESCE(SUM(acd.debit_foreign), 0) AS total_debit_foreign,
    COALESCE(SUM(acd.credit_foreign), 0) AS total_credit_foreign,
    CASE 
        WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(acd.debit - acd.credit), 0)
        WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(acd.credit - acd.debit), 0)
        ELSE COALESCE(SUM(acd.debit - acd.credit), 0)
    END AS final_balance,
    CASE 
        WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(acd.debit_base - acd.credit_base), 0)
        WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(acd.credit_base - acd.debit_base), 0)
        ELSE COALESCE(SUM(acd.debit_base - acd.credit_base), 0)
    END AS final_balance_base,
    CASE 
        WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(acd.debit_foreign - acd.credit_foreign), 0)
        WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(acd.credit_foreign - acd.debit_foreign), 0)
        ELSE COALESCE(SUM(acd.debit_foreign - acd.credit_foreign), 0)
    END AS final_balance_foreign
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
);--> statement-breakpoint