import { sql } from 'drizzle-orm';
import {
  date,
  integer,
  numeric,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { purchasingSchema } from '../_schemas';
import {
  accountsPayable,
  purchaseOrders,
  states,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoices,
  supplierPayments,
  suppliers,
} from '../tables';

//Datos maestros del proveedor con su estado geográfico.
export const supplierMaster360 = purchasingSchema.view('supplier_master_360', {
  supplierId: uuid('supplier_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  internalCode: varchar('internal_code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 50 }).notNull(),
  category: text('category').notNull(),
  status: text('status').notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  stateName: varchar('state_name', { length: 100 }),
}).as(sql`
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
  FROM ${suppliers} s
  LEFT JOIN ${states} st ON st.id = s.state
`);

//Órdenes de compra y facturas por proveedor.
export const supplierPurchases360 = purchasingSchema.view(
  'supplier_purchases_360',
  {
    tenantId: uuid('tenant_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    purchaseOrdersCount: integer('po_count').notNull(),
    purchaseOrdersPending: integer('po_pending').notNull(),
    invoicesCount: integer('invoices_count').notNull(),
    invoicesTotal: numeric('invoices_total', {
      precision: 18,
      scale: 2,
    }).notNull(),
    lastInvoiceDate: date('last_invoice_date'),
  },
).as(sql`
  SELECT
    s.tenant_id,
    s.id                                     AS supplier_id,
    COUNT(DISTINCT po.id)                    AS po_count,
    COUNT(DISTINCT po.id) FILTER (WHERE po.status = 'PENDING') AS po_pending,
    COUNT(DISTINCT inv.id)                   AS invoices_count,
    COALESCE(SUM(inv.total_amount), 0)       AS invoices_total,
    MAX(inv.invoice_date)                    AS last_invoice_date
  FROM ${suppliers} s
  LEFT JOIN ${purchaseOrders} po ON po.supplier_id = s.id
  LEFT JOIN ${supplierInvoices} inv ON inv.supplier_id = s.id
  GROUP BY s.id
`);

//Cuentas por pagar y vencimientos.
export const supplierAp360 = purchasingSchema.view('supplier_ap_360', {
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  apCount: integer('ap_count').notNull(),
  apTotalOriginal: numeric('ap_original', {
    precision: 18,
    scale: 2,
  }).notNull(),
  apTotalPaid: numeric('ap_paid', { precision: 18, scale: 2 }).notNull(),
  apTotalRemaining: numeric('ap_remaining', {
    precision: 18,
    scale: 2,
  }).notNull(),
  apOverdue: numeric('ap_overdue', { precision: 18, scale: 2 }).notNull(),
}).as(sql`
  SELECT
    s.tenant_id,
    s.id                                      AS supplier_id,
    COUNT(ap.id)                              AS ap_count,
    COALESCE(SUM(ap.original_amount), 0)      AS ap_original,
    COALESCE(SUM(ap.paid_amount), 0)          AS ap_paid,
    COALESCE(SUM(ap.remaining_amount), 0)     AS ap_remaining,
    COALESCE(SUM(ap.remaining_amount) FILTER (WHERE ap.due_date < CURRENT_DATE), 0) AS ap_overdue
  FROM ${suppliers} s
  LEFT JOIN ${accountsPayable} ap ON ap.supplier_id = s.id
  GROUP BY s.id
`);

//Anticipos entregados a proveedores.

export const supplierAdvances360 = purchasingSchema.view(
  'supplier_advances_360',
  {
    tenantId: uuid('tenant_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    advancesCount: integer('advances_count').notNull(),
    advancesTotal: numeric('advances_total', {
      precision: 18,
      scale: 2,
    }).notNull(),
    advancesAvailable: numeric('advances_available', {
      precision: 18,
      scale: 2,
    }).notNull(),
  },
).as(sql`
  SELECT
    s.tenant_id,
    s.id                                          AS supplier_id,
    COUNT(a.id)                                   AS advances_count,
    COALESCE(SUM(a.amount), 0)                    AS advances_total,
    COALESCE(SUM(a.available_amount), 0)          AS advances_available
  FROM ${suppliers} s
  LEFT JOIN ${supplierAdvances} a ON a.supplier_id = s.id
  GROUP BY s.id
`);

//Notas de crédito y débito de proveedores.
export const supplierNotes360 = purchasingSchema.view('supplier_notes_360', {
  tenantId: uuid('tenant_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  creditNotesCount: integer('cn_count').notNull(),
  creditNotesAmount: numeric('cn_amount', {
    precision: 18,
    scale: 2,
  }).notNull(),
  creditNotesAvailable: numeric('cn_available', {
    precision: 18,
    scale: 2,
  }).notNull(),
  debitNotesCount: integer('dn_count').notNull(),
  debitNotesAmount: numeric('dn_amount', { precision: 18, scale: 2 }).notNull(),
}).as(sql`
  SELECT
    s.tenant_id,
    s.id            AS supplier_id,
    COUNT(DISTINCT cn.id)                          AS cn_count,
    COALESCE(SUM(cn.amount), 0)                    AS cn_amount,
    COALESCE(SUM(cn.available_amount), 0)          AS cn_available,
    COUNT(DISTINCT dn.id)                          AS dn_count,
    COALESCE(SUM(dn.amount), 0)                    AS dn_amount
  FROM ${suppliers} s
  LEFT JOIN ${supplierCreditNotes} cn ON cn.supplier_id = s.id
  LEFT JOIN ${supplierDebitNotes} dn ON dn.supplier_id = s.id
  GROUP BY s.id
`);

//Pagos realizados a proveedores.
export const supplierPayments360 = purchasingSchema.view(
  'supplier_payments_360',
  {
    tenantId: uuid('tenant_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    paymentsCount: integer('payments_count').notNull(),
    paymentsTotal: numeric('payments_total', {
      precision: 18,
      scale: 2,
    }).notNull(),
    lastPaymentDate: date('last_payment_date'),
  },
).as(sql`
  SELECT
    s.tenant_id,
    s.id            AS supplier_id,
    COUNT(p.id)                                AS payments_count,
    COALESCE(SUM(p.total_amount), 0)           AS payments_total,
    MAX(p.requested_at)                        AS last_payment_date
  FROM ${suppliers} s
  LEFT JOIN ${supplierPayments} p ON p.supplier_id = s.id
  GROUP BY s.id
`);

//Vista consolidada de todas las métricas de proveedor, calculando el saldo neto (netBalance).
export const supplierTotal360 = purchasingSchema.view('supplier_total_360', {
  supplierId: uuid('supplier_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  internalCode: varchar('internal_code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 50 }).notNull(),
  category: text('category').notNull(),
  status: text('status').notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  stateName: varchar('state_name', { length: 100 }),
  poCount: integer('po_count').notNull(),
  poPending: integer('po_pending').notNull(),
  invoicesCount: integer('invoices_count').notNull(),
  invoicesTotal: numeric('invoices_total', {
    precision: 18,
    scale: 2,
  }).notNull(),
  lastInvoiceDate: date('last_invoice_date'),
  apCount: integer('ap_count').notNull(),
  apOriginal: numeric('ap_original', { precision: 18, scale: 2 }).notNull(),
  apPaid: numeric('ap_paid', { precision: 18, scale: 2 }).notNull(),
  apRemaining: numeric('ap_remaining', { precision: 18, scale: 2 }).notNull(),
  apOverdue: numeric('ap_overdue', { precision: 18, scale: 2 }).notNull(),
  advancesCount: integer('advances_count').notNull(),
  advancesTotal: numeric('advances_total', {
    precision: 18,
    scale: 2,
  }).notNull(),
  advancesAvailable: numeric('advances_available', {
    precision: 18,
    scale: 2,
  }).notNull(),
  cnCount: integer('cn_count').notNull(),
  cnAmount: numeric('cn_amount', { precision: 18, scale: 2 }).notNull(),
  cnAvailable: numeric('cn_available', { precision: 18, scale: 2 }).notNull(),
  dnCount: integer('dn_count').notNull(),
  dnAmount: numeric('dn_amount', { precision: 18, scale: 2 }).notNull(),
  paymentsCount: integer('payments_count').notNull(),
  paymentsTotal: numeric('payments_total', {
    precision: 18,
    scale: 2,
  }).notNull(),
  lastPaymentDate: date('last_payment_date'),
  netBalance: numeric('net_balance', { precision: 18, scale: 2 }).notNull(),
}).as(sql`
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
  FROM ${supplierMaster360} m
  LEFT JOIN ${supplierPurchases360} p ON p.supplier_id = m.supplier_id
  LEFT JOIN ${supplierAp360} ap ON ap.supplier_id = m.supplier_id
  LEFT JOIN ${supplierAdvances360} adv ON adv.supplier_id = m.supplier_id
  LEFT JOIN ${supplierNotes360} n ON n.supplier_id = m.supplier_id
  LEFT JOIN ${supplierPayments360} py ON py.supplier_id = m.supplier_id
`);
