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
    calculatedBalance: numeric('calculated_balance', {
      precision: 18,
      scale: 4,
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
      scale: 4, // Asegúrate de que la escala sea la misma que 'amount'
    }).notNull(),
    lastMovementDate: timestamp('last_movement_date'),

    // --- Columnas de desglose ---
    haberesContribution: numeric('haberes_contribution', {
      precision: 18,
      scale: 4,
    }).notNull(),
    haberesVoluntary: numeric('haberes_voluntary', {
      precision: 18,
      scale: 4,
    }).notNull(),
    haberesEmployer: numeric('haberes_employer', {
      precision: 18,
      scale: 4,
    }).notNull(),
    surpluses: numeric('surpluses', {
      precision: 18,
      scale: 4,
    }).notNull(),
    totalWithdrawals: numeric('total_withdrawals', {
      precision: 18,
      scale: 4,
    }).notNull(),
    totalWithdrawalFees: numeric('total_withdrawal_fees', {
      precision: 18,
      scale: 4,
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
                  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT'::public.associate_movement_type_enum
              ]) THEN ${associateAccountMovements.amount}
              -- Movimientos que RESTAN del Haber Patrimonial (Reducciones del Capital Propio)
              WHEN ${associateAccountMovements.movementType} = ANY (ARRAY[
                  'SAVING_WITHDRAWAL'::public.associate_movement_type_enum,
                  'WITHDRAWAL_FEE_DEBIT'::public.associate_movement_type_enum,
                  'ADJUSTMENT_DEBIT'::public.associate_movement_type_enum,
                  'FEE_CORRECTION_DEBIT'::public.associate_movement_type_enum
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
