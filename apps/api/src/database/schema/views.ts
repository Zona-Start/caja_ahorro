import { sql } from 'drizzle-orm';
import {
  decimal,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { accountsPayable, suppliers } from './administration';
import {
  associateAccountMovements,
  associateAccounts,
  creditAmortizationSchedule,
  credits,
  loanAmortizationSchedule,
  loans,
} from './savings-banks';
import { administrationSchema, savingsBanksSchema } from './schemas';

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

export const supplierAvailableCredits = administrationSchema.view(
  'supplier_available_credits_view',
  {
    supplierId: integer('supplier_id').notNull(),
    supplierName: text('supplier_name').notNull(),
    taxId: text('tax_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    availableCredit: decimal('available_credit', {
      precision: 20,
      scale: 6,
    }).notNull(),
    credits: jsonb('credits').notNull(),
  },
).as(sql`
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
          WHEN ap.status = 'ADVANCE' THEN 'Anticipo'
          ELSE 'Nota de credito'
        END,
        'amount', ABS(ap.remaining_amount)
      ) ORDER BY ap.created_at
    ) AS credits
  FROM
    ${accountsPayable} ap
  JOIN
      ${suppliers} s ON s.id = ap.supplier_id
  WHERE
    ap.remaining_amount < 0
    AND ap.status <> 'CANCELLED'
  GROUP BY
    ap.supplier_id,
    s.name,
    s.tax_id,
    ap.currency_code
`);

// export const accountsPayableSummaryView = accountsPayableSchema.view(
//   'accounts_payable_summary',
//   {
//     totalAmount: numeric('total_amount', { precision: 18, scale: 2 }),
//     pendingAmount: numeric('pending_amount', { precision: 18, scale: 2 }),
//     paidAmount: numeric('paid_amount', { precision: 18, scale: 2 }),
//     overdueAmount: numeric('overdue_amount', { precision: 18, scale: 2 }),
//   },
// ).as(sql`
//   SELECT
//     SUM(${accountsPayable.totalAmount}) AS total_amount,
//     SUM(CASE WHEN ${accountsPayable.status} = 'PENDING' THEN ${accountsPayable.remainingAmount} ELSE 0 END) AS pending_amount,
//     SUM(CASE WHEN ${accountsPayable.status} = 'PAID' THEN ${accountsPayable.paidAmount} ELSE 0 END) AS paid_amount,
//     SUM(
//       CASE
//         WHEN ${accountsPayable.status} = 'PENDING' AND ${accountsPayable.dueDate} < CURRENT_DATE THEN ${accountsPayable.remainingAmount}
//         ELSE 0
//       END
//     ) AS overdue_amount
//   FROM ${accountsPayable}
// `);
