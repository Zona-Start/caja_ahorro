CREATE VIEW "purchasing"."supplier_master_360" AS (
  SELECT
    s.id            AS supplier_id,
    s.tenant_id,
    s.internal_code,
    s.name,
    s.tax_id,
    s.category::text,
    s.status::text,
    s.contact_name,
    s.contact_email,
    s.contact_phone,
    s.address,
    st.name         AS state_name
  FROM "purchasing"."suppliers" s
  LEFT JOIN "core"."states" st ON st.id = s.state
);--> statement-breakpoint
CREATE VIEW "purchasing"."supplier_total_360" AS (
  SELECT
    m.supplier_id,
    m.tenant_id,
    m.internal_code,
    m.name,
    m.tax_id,
    m.category,
    m.status,
    m.contact_name,
    m.contact_email,
    m.contact_phone,
    m.address,
    m.state_name,
    COALESCE(p.po_count, 0)             AS po_count,
    COALESCE(p.po_pending, 0)           AS po_pending,
    COALESCE(p.invoices_count, 0)       AS invoices_count,
    COALESCE(p.invoices_total, 0)       AS invoices_total,
    p.last_invoice_date,
    COALESCE(ap.ap_count, 0)            AS ap_count,
    COALESCE(ap.ap_original, 0)         AS ap_original,
    COALESCE(ap.ap_paid, 0)             AS ap_paid,
    COALESCE(ap.ap_remaining, 0)        AS ap_remaining,
    COALESCE(ap.ap_overdue, 0)          AS ap_overdue,
    COALESCE(adv.advances_count, 0)     AS advances_count,
    COALESCE(adv.advances_total, 0)     AS advances_total,
    COALESCE(adv.advances_available, 0) AS advances_available,
    COALESCE(n.cn_count, 0)             AS cn_count,
    COALESCE(n.cn_amount, 0)            AS cn_amount,
    COALESCE(n.cn_available, 0)         AS cn_available,
    COALESCE(n.dn_count, 0)             AS dn_count,
    COALESCE(n.dn_amount, 0)            AS dn_amount,
    COALESCE(py.payments_count, 0)      AS payments_count,
    COALESCE(py.payments_total, 0)      AS payments_total,
    py.last_payment_date,
    /* saldo neto = AP pendiente + ND - NC disponible - anticipos disponibles - pagos */
    COALESCE(ap.ap_remaining, 0)
      + COALESCE(n.dn_amount, 0)
      - COALESCE(n.cn_available, 0)
      - COALESCE(adv.advances_available, 0)
      - COALESCE(py.payments_total, 0)    AS net_balance
  FROM "purchasing"."supplier_master_360" m
  LEFT JOIN "purchasing"."supplier_purchases_360" p ON p.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_ap_360" ap ON ap.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_advances_360" adv ON adv.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_notes_360" n ON n.supplier_id = m.supplier_id
  LEFT JOIN "purchasing"."supplier_payments_360" py ON py.supplier_id = m.supplier_id
);