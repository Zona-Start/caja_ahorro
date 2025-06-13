import { sql } from 'drizzle-orm';
import { integer, numeric, serial, text, timestamp } from 'drizzle-orm/pg-core';
import {
  associateAccountMovements,
  associateAccounts,
  creditAmortizationSchedule,
  credits,
  loanAmortizationSchedule,
  loans,
} from './savings-banks';
import { savingsBanksSchema } from './schemas';

export const associateAccountBalances = savingsBanksSchema
  .view('associate_account_balances', {
    associateAccountId: serial('associate_account_id').primaryKey(),
    associatedId: integer('associated_id').notNull(),
    accountNumber: text('account_number').notNull(),
    currencyCode: text('currency_code').notNull(),
    calculatedBalance: integer('calculated_balance').notNull(),
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
          WHEN aam.movement_type IN (
            'SAVING_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION', 'DIVIDEND_CREDIT', 
            'LOAN_DISBURSEMENT_CREDIT', 'OTHER_CREDIT', 'ADJUSTMENT_CREDIT', 
            'FEE_REIMBURSEMENT_CREDIT'
          ) THEN aam.amount
          WHEN aam.movement_type IN (
            'SAVING_WITHDRAWAL', 'LOAN_PAYMENT_DEBIT', 'FEE_DEBIT', 
            'WITHDRAWAL_FEE_DEBIT', 'LOAN_INTEREST_DEBIT', 'OTHER_DEBIT', 
            'ADJUSTMENT_DEBIT', 'FEE_CORRECTION_DEBIT'
          ) THEN -aam.amount
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
    approvedAmount: text('approved_amount').notNull(), // o decimal si es numérico
    outstandingPrincipalBalance: text('outstanding_principal_balance'), // ajustar tipo según BD
  },
).as(sql`
  SELECT
    l.id AS loan_id,
    l.associate_id,
    l.currency_code,
    l.status AS loan_status,
    l.approved_amount,
    (las.principal_amount + las.principal_balance_pending) AS outstanding_principal_balance
  FROM
    ${loans} l
  JOIN
     ${loanAmortizationSchedule} las ON l.id = las.loan_id
  WHERE
    l.status IN (${sql`'APPROVED'`}, ${sql`'DISBURSED'`}, ${sql`'IN_PAYMENT'`}, ${sql`'OVERDUE'`})
    AND las.payment_status IN (${sql`'PENDING'`}, ${sql`'PARTIAL'`})
  GROUP BY
    l.id, l.associate_id, l.currency_code, l.status, l.approved_amount, las.principal_amount, las.installment_number,las.principal_balance_pending
  ORDER BY las.installment_number asc
  LIMIT 1
`);

export const creditOutstandingBalance = savingsBanksSchema.view(
  'credit_outstanding_balance',
  {
    creditId: serial('credit_id').primaryKey(),
    associateId: integer('associate_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    creditStatus: text('credit_status').notNull(),
    rquestedAmount: text('requested_amount').notNull(),
    outstandingPrincipalBalance: text('outstanding_principal_balance'), // Ajusta tipo si es numérico
  },
).as(sql`
  SELECT
    c.associate_id,
    c.currency_code,
    c.status AS credit_status,
    c.requested_amount,
    cas.principal_amount + cas.principal_balance_pending AS outstanding_principal_balance
  FROM
    ${credits} c
  JOIN
     ${creditAmortizationSchedule} cas ON c.id = cas.credit_id
  WHERE
    c.status IN (${sql`'APPROVED'`}, ${sql`'IN_PAYMENT'`}) AND cas.payment_status IN (${sql`'PENDING'`}, ${sql`'PARTIAL'`})
  GROUP BY c.id, c.associate_id, c.currency_code, c.status, c.requested_amount , cas.principal_amount,cas.installment_number, cas.principal_balance_pending
  ORDER BY cas.installment_number
  LIMIT 1
`);

// --- Definición de la Vista de Haberes Patrimoniales ---
export const associateHaberesBalance = savingsBanksSchema.view(
  'associate_haberes_balance',
  {
    associateAccountId: integer('associate_account_id').notNull(),
    haberesBalance: numeric('haberes_balance', {
      precision: 18,
      scale: 2,
    }).notNull(),
    lastMovementDate: timestamp('last_movement_date'),
  },
).as(sql`
  SELECT
      ${associateAccountMovements.associateAccountId},
      SUM(
          CASE
              -- Movimientos que SUMAN al Haber Patrimonial (Capital Propio)
              WHEN ${associateAccountMovements.movementType} IN (
                  'SAVING_CONTRIBUTION',
                  'EMPLOYER_CONTRIBUTION',
                  'ADJUSTMENT_CREDIT',
                  'LOAN_OVERPAYMENT_CREDIT',
                  'CREDIT_OVERPAYMENT_CREDIT'
              ) THEN ${associateAccountMovements.amount}
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN ${associateAccountMovements.movementType} IN (
                  'SAVING_WITHDRAWAL',
                  'WITHDRAWAL_FEE_DEBIT',
                  'ADJUSTMENT_DEBIT',
                  'FEE_CORRECTION_DEBIT'
              ) THEN -${associateAccountMovements.amount}
              ELSE 0
          END
      ) AS haberes_balance,
      MAX(${associateAccountMovements.transactionDate}) AS last_movement_date
  FROM
      ${associateAccountMovements}
  GROUP BY
      ${associateAccountMovements.associateAccountId}
`);
