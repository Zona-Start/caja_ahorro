import { sql } from 'drizzle-orm';
import { numeric, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { savingsSchema } from '../_schemas';
import {
  associateAccountMovements,
  associateAccounts,
  associates,
  creditAmortizationSchedule,
  credits,
  loanAmortizationSchedule,
  loans,
} from '../tables/savings';

//Saldo calculado de cada cuenta de asociado considerando solo movimientos completados.
export const associateAccountBalances = savingsSchema.view(
  'associate_account_balances',
  {
    tenantId: uuid('tenant_id').notNull(),
    associateAccountId: uuid('associate_account_id').notNull(),
    associateId: uuid('associate_id').notNull(),
    accountNumber: varchar('account_number', { length: 20 }).notNull(),
    currencyCode: text('currency_code').notNull(),
    status: text('status').notNull(),
    calculatedBalance: numeric('calculated_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
    SELECT
      a.tenant_id AS tenant_id,
      aa.id AS associate_account_id,
      aa.associate_id,
      aa.account_number,
      aa.currency_code,
      aa.status,
      COALESCE(SUM(
        CASE
          WHEN aam.movement_type IN (
            'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION',
            'LOAN_DISBURSEMENT_CREDIT','SPECIAL_LOAN_DISBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT','SPECIAL_CREDIT_DISBURSEMENT_CREDIT',
            'LOAN_REFINANCING_CREDIT','LOAN_REIMBURSEMENT_CREDIT',
            'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT','LOAN_OVERPAYMENT_CREDIT',
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT','LOAN_PARTIAL_DISBURSEMENT_CREDIT',
            'DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT','ADJUSTMENT_CREDIT','OTHER_CREDIT'
          ) THEN aam.amount
          WHEN aam.movement_type IN (
            'SAVING_WITHDRAWAL','LOAN_REFINANCING_DEBIT','LOAN_PAYMENT_DEBIT',
            'COMMERCIAL_CREDIT_PAYMENT_DEBIT','WITHDRAWAL_FEE_DEBIT',
            'LOAN_INTEREST_DEBIT','LOAN_FEE_DEBIT','LOAN_ADMIN_FEE_DEBIT',
            'LATE_PAYMENT_FEE_DEBIT','PAYMENT_REVERSAL_DEBIT',
            'CREDIT_ADMIN_FEE_DEBIT','ADJUSTMENT_DEBIT','FEE_CORRECTION_DEBIT',
            'ADMIN_FEE_DEBIT','OTHER_DEBIT','FEE_DEBIT'
          ) THEN -aam.amount
          ELSE 0
        END
      ), 0) AS calculated_balance
    FROM ${associateAccounts} aa
    INNER JOIN ${associates} a ON aa.associate_id = a.id
    LEFT JOIN ${associateAccountMovements} aam
      ON aa.id = aam.associate_account_id AND aam.status = 'COMPLETED'
    GROUP BY a.tenant_id, aa.id, aa.associate_id, aa.account_number, aa.currency_code
  `);

//Saldo pendiente de préstamos activos (capital + intereses no pagados).
export const loanOutstandingBalance = savingsSchema.view(
  'loan_outstanding_balance',
  {
    loanId: uuid('loan_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    associateId: uuid('associate_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    loanStatus: text('loan_status').notNull(),
    totalPrincipalPending: numeric('total_principal_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInterestPending: numeric('total_interest_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    outstandingTotalBalance: numeric('outstanding_total_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
    l.id AS loan_id,
    l.tenant_id,
    l.associate_id,
    l.currency_code,
    l.status::text AS loan_status,
    COALESCE(SUM(las.principal_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(las.interest_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(las.principal_amount + las.interest_amount) FILTER (WHERE las.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM ${loans} l
  JOIN ${loanAmortizationSchedule} las ON l.id = las.loan_id
  WHERE l.status IN ('DISBURSED','IN_PAYMENT','OVERDUE')
  GROUP BY l.id, l.tenant_id, l.associate_id, l.currency_code, l.status
`);

// Saldo pendiente de créditos comerciales (capital + intereses no pagados).
export const creditOutstandingBalance = savingsSchema.view(
  'credit_outstanding_balance',
  {
    creditId: uuid('credit_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    associateId: uuid('associate_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    creditStatus: text('credit_status').notNull(),
    totalPrincipalPending: numeric('total_principal_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInterestPending: numeric('total_interest_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    outstandingTotalBalance: numeric('outstanding_total_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
    c.id AS credit_id,
    c.tenant_id,
    c.associate_id,
    c.currency_code,
    c.status::text AS credit_status,
    COALESCE(SUM(cas.principal_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_principal_pending,
    COALESCE(SUM(cas.interest_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS total_interest_pending,
    COALESCE(SUM(cas.principal_amount + cas.interest_amount) FILTER (WHERE cas.payment_status IN ('PENDING','PARTIAL')), 0) AS outstanding_total_balance
  FROM ${credits} c
  JOIN ${creditAmortizationSchedule} cas ON c.id = cas.credit_id
  WHERE c.status IN ('APPROVED','IN_PAYMENT')
  GROUP BY c.id, c.tenant_id, c.associate_id, c.currency_code, c.status
`);

//Detalle del haber patrimonial (capital propio) por cuenta, con desglose de aportes y retiros.
export const associateHaberesBalance = savingsSchema.view(
  'associate_haberes_balance',
  {
    associateAccountId: uuid('associate_account_id').notNull(),
    haberesBalance: numeric('haberes_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
    lastMovementDate: timestamp('last_movement_date'),
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
    surpluses: numeric('surpluses', { precision: 20, scale: 6 }).notNull(),
    totalWithdrawals: numeric('total_withdrawals', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalWithdrawalFees: numeric('total_withdrawal_fees', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
    associate_account_id,
    COALESCE(SUM(amount_change), 0) AS haberes_balance,
    MAX(transaction_date) AS last_movement_date,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_CONTRIBUTION'), 0) AS haberes_contribution,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'VOLUNTARY_SAVINGS'), 0) AS haberes_voluntary,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'EMPLOYER_CONTRIBUTION'), 0) AS haberes_employer,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'DIVIDEND_CREDIT'), 0) AS surpluses,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'SAVING_WITHDRAWAL'), 0) AS total_withdrawals,
    COALESCE(SUM(amount_change) FILTER (WHERE movement_type = 'WITHDRAWAL_FEE_DEBIT'), 0) AS total_withdrawal_fees
  FROM (
    SELECT
      associate_account_id,
      movement_type,
      CASE
        WHEN movement_type IN (
          'SAVING_CONTRIBUTION','VOLUNTARY_SAVINGS','EMPLOYER_CONTRIBUTION',
          'ADJUSTMENT_CREDIT','DIVIDEND_CREDIT','FEE_REIMBURSEMENT_CREDIT',
          'LOAN_OVERPAYMENT_CREDIT','COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',
          'SAVING_WITHDRAWAL_REVERSAL_CREDIT','LIQUIDATION_BALANCE_REVERSAL_CREDIT',
          'ACCOUNTING_ADJUSTMENT_CREDIT','OTHER_CREDIT'
        ) THEN amount
        WHEN movement_type IN (
          'SAVING_WITHDRAWAL','WITHDRAWAL_FEE_DEBIT','ADJUSTMENT_DEBIT',
          'FEE_CORRECTION_DEBIT','PAYMENT_REVERSAL_DEBIT','ADMIN_FEE_DEBIT',
          'OTHER_DEBIT','FEE_DEBIT','LIQUIDATION_BALANCE',
          'ACCOUNTING_ADJUSTMENT_DEBIT','LIQUIDATION_LOAN_PAYMENT_DEBIT',
          'LIQUIDATION_CREDIT_PAYMENT_DEBIT','LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT',
          'LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT','LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT'
        ) THEN -amount
        ELSE 0
      END AS amount_change,
      transaction_date
    FROM ${associateAccountMovements}
    WHERE status = 'COMPLETED'
  ) sub
  GROUP BY associate_account_id
`);
