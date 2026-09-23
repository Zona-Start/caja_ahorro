DROP VIEW "savings"."credit_outstanding_balance";--> statement-breakpoint
DROP VIEW "savings"."loan_outstanding_balance";--> statement-breakpoint
CREATE VIEW "savings"."credit_outstanding_balance" AS (
  SELECT
    c.id AS credit_id,
    c.tenant_id,
    c.associate_id,
    c.currency_code,
    c.status::text AS credit_status,
    COALESCE(SUM(
      CASE
        WHEN cas.payment_status = 'PARTIAL' THEN
          GREATEST(cas.principal_amount - GREATEST(COALESCE(cas.paid_amount, 0) - cas.interest_amount, 0), 0)
        ELSE cas.principal_amount
      END
    ) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(
      CASE
        WHEN cas.payment_status = 'PARTIAL' THEN
          GREATEST(cas.interest_amount - COALESCE(cas.paid_amount, 0), 0)
        ELSE cas.interest_amount
      END
    ) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(
      GREATEST((cas.principal_amount + cas.interest_amount) - COALESCE(cas.paid_amount, 0), 0)
    ) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM "savings"."credits" c
  JOIN "savings"."credit_amortization_schedule" cas ON c.id = cas.credit_id
  WHERE c.status IN ('APPROVED','IN_PAYMENT')
  GROUP BY c.id, c.tenant_id, c.associate_id, c.currency_code, c.status
);--> statement-breakpoint
CREATE VIEW "savings"."loan_outstanding_balance" AS (
  SELECT
    l.id AS loan_id,
    l.tenant_id,
    l.associate_id,
    l.currency_code,
    l.status::text AS loan_status,
    COALESCE(SUM(
      CASE
        WHEN las.payment_status = 'PARTIAL' THEN
          GREATEST(las.principal_amount - GREATEST(COALESCE(las.paid_amount, 0) - las.interest_amount, 0), 0)
        ELSE las.principal_amount
      END
    ) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(
      CASE
        WHEN las.payment_status = 'PARTIAL' THEN
          GREATEST(las.interest_amount - COALESCE(las.paid_amount, 0), 0)
        ELSE las.interest_amount
      END
    ) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(
      GREATEST((las.principal_amount + las.interest_amount) - COALESCE(las.paid_amount, 0), 0)
    ) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM "savings"."loans" l
  JOIN "savings"."loan_amortization_schedule" las ON l.id = las.loan_id
  WHERE l.status IN ('DISBURSED','IN_PAYMENT','OVERDUE')
  GROUP BY l.id, l.tenant_id, l.associate_id, l.currency_code, l.status
);