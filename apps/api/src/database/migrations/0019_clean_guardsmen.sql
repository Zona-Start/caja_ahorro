DROP VIEW "administration"."supplier_available_credits_view";--> statement-breakpoint
CREATE VIEW "administration"."supplier_available_credits_view" AS (
     SELECT
    ap.supplier_id AS supplier_id,
    s.name AS supplier_name,
    s.tax_id AS tax_id,
    ap.currency_code AS currency_code,
    SUM(ABS(ap.remaining_amount)) AS available_credit,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'cxpId', ap.id,
        'cxpNumber', ap.ap_number,
        'origin', CASE
          WHEN ap.status = 'ADVANCE' THEN 'ADVANCE'
          ELSE 'CREDIT_NOTE'
        END,
        'amount', ABS(ap.remaining_amount)
      ) ORDER BY ap.created_at
    ) AS credits
  FROM
    "administration"."accounts_payable" ap
  JOIN
      "administration"."suppliers" s ON s.id = ap.supplier_id
  WHERE
    ap.remaining_amount < 0
    AND ap.status <> 'CANCELLED'
  GROUP BY
    ap.supplier_id,
    s.name,
    s.tax_id,
    ap.currency_code
);