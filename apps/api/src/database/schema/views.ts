import { sql } from 'drizzle-orm';
import {
  date,
  decimal,
  integer,
  json,
  numeric,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  accountingSchema,
  administrationSchema,
  authSchema,
  bankingSchema,
  inventorySchema,
  savingsBanksSchema,
} from './schemas';
import {
  accountingEntries,
  accountingEntryDetails,
  accountPlan,
} from './tables/accounting';
import {
  accountsPayable,
  inventoryMovements,
  purchaseOrders,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoices,
  supplierPayments,
  suppliers,
} from './tables/administration';
import { bankAccounts, bankTransactions } from './tables/banking';
import { states } from './tables/core';
import {
  associateAccountMovements,
  associateAccounts,
  creditAmortizationSchedule,
  credits,
  loanAmortizationSchedule,
  loans,
} from './tables/savings-banks';

export const associateAccountBalances = savingsBanksSchema
  .view('associate_account_balances', {
    associateAccountId: serial('associate_account_id').primaryKey(),
    associatedId: integer('associated_id').notNull(),
    accountNumber: text('account_number').notNull(),
    currencyCode: text('currency_code').notNull(),
    calculatedBalance: numeric('calculated_balance', {
      precision: 20,
      scale: 6,
    }).notNull(), // Asumiendo numeric, no integer
  })
  .as(
    sql`
    SELECT
      aa.id AS associate_account_id,
      aa.associated_id,
      aa.account_number,
      aa.currency_code,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
            'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
            'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
            'LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_LOAN_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'SPECIAL_CREDIT_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_CREDIT'::public.associate_movement_type_enum,
            'LOAN_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
            'LOAN_PARTIAL_DISBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
            'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
            'OTHER_CREDIT'::public.associate_movement_type_enum
          ]) THEN aam.amount
          WHEN aam.movement_type = ANY (ARRAY[
            'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
            'LOAN_REFINANCING_DEBIT'::public.associate_movement_type_enum,
            'LOAN_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT'::public.associate_movement_type_enum,
            'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_INTEREST_DEBIT'::public.associate_movement_type_enum,
            'LOAN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LOAN_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'LATE_PAYMENT_FEE_DEBIT'::public.associate_movement_type_enum,
            'PAYMENT_REVERSAL_DEBIT'::public.associate_movement_type_enum,
            'CREDIT_ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
            'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
            'ADMIN_FEE_DEBIT'::public.associate_movement_type_enum,
            'OTHER_DEBIT'::public.associate_movement_type_enum,
            'FEE_DEBIT'::public.associate_movement_type_enum
          ]) THEN - aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM
      ${associateAccounts} aa
    LEFT JOIN
      ${associateAccountMovements} aam ON aa.id = aam.associate_account_id
    GROUP BY
      aa.id, aa.associated_id, aa.account_number, aa.currency_code
  `,
  );

export const loanOutstandingBalance = savingsBanksSchema.view(
  'loan_outstanding_balance',
  {
    loanId: serial('loan_id').primaryKey(),
    associateId: integer('associate_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    loanStatus: text('loan_status').notNull(),
    totalPrincipalPending: decimal('total_principal_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInterestPending: decimal('total_interest_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    outstandingTotalBalance: decimal('outstanding_total_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
      l.id AS loan_id,
      l.associate_id,
      l.currency_code,
      l.status AS loan_status,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) AS total_principal_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS total_interest_pending,
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.principal_amount ELSE 0 END) +
      SUM(CASE WHEN las.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN las.interest_amount ELSE 0 END) AS outstanding_total_balance
  FROM
      ${loans} l
  JOIN
      ${loanAmortizationSchedule} las ON l.id = las.loan_id
  WHERE
      l.status IN ('DISBURSED'::loan_status_enum, 'IN_PAYMENT'::loan_status_enum, 'OVERDUE'::loan_status_enum)
  GROUP BY
      l.id,
      l.associate_id,
      l.currency_code,
      l.status
`);

export const creditOutstandingBalance = savingsBanksSchema.view(
  'credit_outstanding_balance',
  {
    creditId: serial('credit_id').primaryKey(),
    associateId: integer('associate_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    creditStatus: text('credit_status').notNull(),
    totalPrincipalPending: decimal('total_principal_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInterestPending: decimal('total_interest_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    outstandingTotalBalance: decimal('outstanding_total_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
      c.id AS credit_id,
      c.associate_id,
      c.currency_code,
      c.status AS credit_status,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.principal_amount ELSE 0 END) AS total_principal_pending,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.interest_amount ELSE 0 END) AS total_interest_pending,
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.principal_amount ELSE 0 END) +
      SUM(CASE WHEN cas.payment_status IN ('PENDING'::payment_status_enum, 'PARTIAL'::payment_status_enum) THEN cas.interest_amount ELSE 0 END) AS outstanding_total_balance
  FROM
      ${credits} c
  JOIN
      ${creditAmortizationSchedule} cas ON c.id = cas.credit_id
  WHERE
      c.status IN ('APPROVED'::credit_status_enum, 'IN_PAYMENT'::credit_status_enum)
  GROUP BY
      c.id,
      c.associate_id,
      c.currency_code,
      c.status
`);

// --- Definición de la Vista de Haberes Patrimoniales ---
export const associateHaberesBalance = savingsBanksSchema.view(
  'associate_haberes_balance',
  {
    associateAccountId: integer('associate_account_id').notNull(),
    haberesBalance: numeric('haberes_balance', {
      precision: 20,
      scale: 6, // Asegúrate de que la escala sea la misma que 'amount'
    }).notNull(),
    lastMovementDate: timestamp('last_movement_date'),

    // --- Columnas de desglose ---
    haberesContribution: numeric('haberes_contribution', {
      precision: 20,
      scale: 6,
    }).notNull(),
    haberesVoluntary: numeric('haberes_voluntary', {
      precision: 20,
      scale: 6,
    }).notNull(),
    haberesEmployer: numeric('haberes_employer', {
      precision: 20,
      scale: 6,
    }).notNull(),
    surpluses: numeric('surpluses', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalWithdrawals: numeric('total_withdrawals', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalWithdrawalFees: numeric('total_withdrawal_fees', {
      precision: 20,
      scale: 6,
    }).notNull(),
    // --- Fin de nuevas columnas ---
  },
).as(sql`
  SELECT
      ${associateAccountMovements.associateAccountId},
      -- Saldo total de haberes (la suma y resta de todos los movimientos que componen el haber)
      SUM(
          CASE
              -- Movimientos que SUMAN al Haber Patrimonial (Capital Propio)
              WHEN ${associateAccountMovements.movementType} = ANY (ARRAY[
                  'SAVING_CONTRIBUTION'::public.associate_movement_type_enum,
                  'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum,
                  'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum,
                  'ADJUSTMENT_CREDIT'::public.associate_movement_type_enum,
                  'DIVIDEND_CREDIT'::public.associate_movement_type_enum,
                  'FEE_REIMBURSEMENT_CREDIT'::public.associate_movement_type_enum,
                  'LOAN_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum,
                  'SAVING_WITHDRAWAL_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE_REVERSAL_CREDIT'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_CREDIT'::associate_movement_type_enum,
                  'OTHER_CREDIT'::associate_movement_type_enum
              ]) THEN ${associateAccountMovements.amount}
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN ${associateAccountMovements.movementType} = ANY (ARRAY[
                  'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
                  'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
                  'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
                  'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum,
                  'PAYMENT_REVERSAL_DEBIT'::associate_movement_type_enum, -- Aunque es "PAYMENT", podría ser una reversión de pago de algo no crediticio
                  'ADMIN_FEE_DEBIT'::associate_movement_type_enum,
                  'OTHER_DEBIT'::associate_movement_type_enum,
                  'FEE_DEBIT'::associate_movement_type_enum,
                  'LIQUIDATION_BALANCE'::associate_movement_type_enum,
                  'ACCOUNTING_ADJUSTMENT_DEBIT'::associate_movement_type_enum
              ]) THEN -${associateAccountMovements.amount}
              ELSE 0
          END
      ) AS haberes_balance,
      MAX(${associateAccountMovements.transactionDate}) AS last_movement_date,

      -- --- Columnas de desglose ---
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'SAVING_CONTRIBUTION'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS haberes_contribution,
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'VOLUNTARY_SAVINGS'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS haberes_voluntary,
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'EMPLOYER_CONTRIBUTION'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS haberes_employer,
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'DIVIDEND_CREDIT'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS surpluses,
      -- Nueva columna para la suma de todos los retiros
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'SAVING_WITHDRAWAL'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS total_withdrawals,
      -- Nueva columna para la suma de todos los gastos administrativos por retiros
      COALESCE(SUM(
          CASE
              WHEN ${associateAccountMovements.movementType} = 'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum THEN ${associateAccountMovements.amount}
              ELSE 0
          END
      ), 0) AS total_withdrawal_fees
  FROM
      ${associateAccountMovements}
  GROUP BY
      ${associateAccountMovements.associateAccountId}
`);

//vista de  movimientos de inventario
export const inventoryAvailability = inventorySchema.view(
  'inventory_availability',
  {
    itemId: serial('item_id').primaryKey(),
    itemType: text('item_type').notNull(),
    availableQuantity: integer('available_quantity').notNull(),
  },
).as(sql`
  SELECT
    item_id AS item_id,
    item_type AS item_type,
    SUM(
      CASE
        WHEN movement_type = 'IN' THEN quantity
        WHEN movement_type = 'OUT' THEN -quantity
        WHEN movement_type = 'ADJUST_IN' THEN quantity
        WHEN movement_type = 'ADJUST_OUT' THEN -quantity
        ELSE quantity -- Ajustes u otros tipos se toman con su signo
      END
    ) AS available_quantity
  FROM ${inventoryMovements}
  GROUP BY item_id, item_type
`);

export const accountingBalance = accountingSchema.view('accounting_balance', {
  tenantId: integer('tenant_id').notNull(),
  accountPlanId: integer('account_plan_id').notNull(),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  currencyCode: text('currency_code').notNull(),
  totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull(),
  balance: numeric('balance', { precision: 20, scale: 6 }).notNull(),
}).as(sql`
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
  FROM ${accountPlan} ap
  LEFT JOIN ${accountingEntryDetails} aed 
    ON aed.account_plan_id = ap.id
  LEFT JOIN ${accountingEntries} ae
    ON ae.id = aed.accounting_entry_id
   AND ae.company_id  = ap.company_id 
   AND ae.status = 'POSTED'
  GROUP BY ap.company_id, ap.id, ap.code, ap.name, ap.nature, COALESCE(ae.currency_code, 'VES')
`);

// Clave primaria compuesta
export const accountingBalanceRelations = (view: typeof accountingBalance) => ({
  pk: primaryKey(view.tenantId, view.accountPlanId, view.currencyCode),
});

export const bankStatementBalance = bankingSchema.view(
  'bank_statement_balance',
  {
    bankAccountId: integer('bank_account_id').notNull(),
    accountNumber: varchar('account_number', { length: 20 }).notNull(),
    accountName: varchar('account_name', { length: 255 }),
    currencyCode: text('currency_code').notNull(),
    totalCredits: numeric('total_credits', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalDebits: numeric('total_debits', { precision: 20, scale: 6 }).notNull(),
    currentStatementBalance: numeric('current_statement_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
    lastTransactionDate: date('last_transaction_date'),
  },
).as(sql`
  SELECT 
    ba.id AS bank_account_id,
    ba.account_number,
    ba.account_name,
    ba.currency_code,
    COALESCE(SUM(bt.credit_amount), 0) AS total_credits,
    COALESCE(SUM(bt.debit_amount), 0)  AS total_debits,
    COALESCE(SUM(bt.credit_amount - bt.debit_amount), 0) AS current_statement_balance,
    MAX(bt.transaction_date) AS last_transaction_date
  FROM ${bankAccounts} ba
  LEFT JOIN ${bankTransactions} bt 
         ON bt.bank_account_id = ba.id
  GROUP BY ba.id, ba.account_number, ba.account_name, ba.currency_code
`);

export const accountingBalanceByBank = accountingSchema.view(
  'accounting_balance_by_bank',
  {
    tenantId: integer('tenant_id').notNull(),
    bankAccountId: integer('bank_account_id').notNull(),
    accountPlanId: integer('account_plan_id').notNull(),
    accountCode: text('account_code').notNull(),
    accountName: text('account_name').notNull(),
    currencyCode: text('currency_code').notNull(),
    totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull(),
    totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull(),
    balance: numeric('balance', { precision: 20, scale: 6 }).notNull(),
  },
).as(sql`
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
  FROM ${bankAccounts} ba
  INNER JOIN ${accountPlan} ap ON ap.id = ba.linked_chart_account_id
  LEFT JOIN ${accountingEntryDetails} aed 
         ON aed.account_plan_id = ap.id
  LEFT JOIN ${accountingEntries} ae
         ON ae.id = aed.accounting_entry_id
        AND ae.company_id = ap.company_id
        AND ae.status = 'POSTED'
  GROUP BY ap.company_id, ba.id, ap.id, ap.code, ap.name, ap.nature,
           COALESCE(ae.currency_code, ba.currency_code)
`);

//vista rol-permiso usuario
export const userAccessSummary = authSchema.view('user_access_summary', {
  userId: integer('user_id').notNull(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  fullname: text('fullname').notNull(),
  roles: json('roles').$type<string[]>().notNull(),
  permissions: json('permissions').$type<string[]>().notNull(),
}).as(sql`
  SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u.fullname,
  COALESCE(
    JSON_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
    '[]'
  ) AS roles,
  COALESCE(
    JSON_AGG(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL),
    '[]'
  ) AS permissions
FROM auth.users u
LEFT JOIN auth.user_role ur ON u.id = ur.user_id
LEFT JOIN auth.roles r ON ur.role_id = r.id
LEFT JOIN auth.roles_permissions rp ON r.id = rp.role_id 
LEFT JOIN auth.permissions p ON rp.permissions_id  = p.id
GROUP BY u.id, u.username, u.email, u.fullname
`);

//proveedores vistas
// administrationSchema/views/supplierMaster360.ts
export const supplierMaster360 = administrationSchema.view(
  'supplier_master_360',
  {
    supplierId: integer('supplier_id').notNull(),
    companyId: integer('company_id').notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }).notNull(),
    category: text('category').notNull(),
    status: text('status').notNull(),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    address: text('address'),
    stateName: varchar('state_name', { length: 100 }),
  },
).as(sql`
  SELECT
    s.id            AS supplier_id,
    s.company_id    AS company_id,
    s.code,
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

//ordes de compra y facturas
export const supplierPurchases360 = administrationSchema.view(
  'supplier_purchases_360',
  {
    supplierId: integer('supplier_id').notNull(),
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

//cuentas por pagar
export const supplierAp360 = administrationSchema.view('supplier_ap_360', {
  supplierId: integer('supplier_id').notNull(),
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

//advances
export const supplierAdvances360 = administrationSchema.view(
  'supplier_advances_360',
  {
    supplierId: integer('supplier_id').notNull(),
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
    s.id                                          AS supplier_id,
    COUNT(a.id)                                   AS advances_count,
    COALESCE(SUM(a.amount), 0)                    AS advances_total,
    COALESCE(SUM(a.available_amount), 0)          AS advances_available
  FROM ${suppliers} s
  LEFT JOIN ${supplierAdvances} a ON a.supplier_id = s.id
  GROUP BY s.id
`);

//notas de credito / debito
export const supplierNotes360 = administrationSchema.view(
  'supplier_notes_360',
  {
    supplierId: integer('supplier_id').notNull(),
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
    debitNotesAmount: numeric('dn_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
  },
).as(sql`
  SELECT
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

//pagos
export const supplierPayments360 = administrationSchema.view(
  'supplier_payments_360',
  {
    supplierId: integer('supplier_id').notNull(),
    paymentsCount: integer('payments_count').notNull(),
    paymentsTotal: numeric('payments_total', {
      precision: 18,
      scale: 2,
    }).notNull(),
    lastPaymentDate: date('last_payment_date'),
  },
).as(sql`
  SELECT
     s.id            AS supplier_id,
    COUNT(p.id)                                AS payments_count,
    COALESCE(SUM(p.total_amount), 0)           AS payments_total,
    MAX(p.requested_at)                        AS last_payment_date
  FROM ${suppliers} s
  LEFT JOIN ${supplierPayments} p ON p.supplier_id = s.id
  GROUP BY s.id
`);

//todas las vista unidas
export const supplierTotal360 = administrationSchema.view(
  'supplier_total_360',
  {
    supplierId: integer('supplier_id').notNull(),
    companyId: integer('company_id').notNull(),
    code: varchar('code', { length: 50 }).notNull(),
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

    netBalance: numeric('net_balance', { precision: 18, scale: 2 }).notNull(), // AP + DN - CN - Advances - Payments
  },
).as(sql`
  SELECT
    m.*,
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
    /* saldo neto */
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
