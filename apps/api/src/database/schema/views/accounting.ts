import { sql } from 'drizzle-orm';
import { boolean, integer, numeric, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { accountingSchema } from '../_schemas';
import {
  accountBalances,
  accountingEntries,
  accountingEntryDetails,
  accountPlan,
  bankAccounts,
} from '../tables';
import { accountNatureEnum, accountTypeEnum } from '../enum';

//Agregación de movimientos (débito/crédito) por cuenta y ciclo, solo asientos publicados.
export const periodAccountMovementsView = accountingSchema.view(
  'period_account_movements_view',
  {
    accountPlanId: uuid('account_plan_id').notNull(),
    accountingCycleId: uuid('accounting_cycle_id').notNull(),
    periodDebit: numeric('period_debit', { precision: 20, scale: 6 }).notNull(),
    periodCredit: numeric('period_credit', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
  SELECT
    aed.account_plan_id,
    ae.accounting_cycle_id,
    COALESCE(SUM(aed.debit), 0) AS period_debit,
    COALESCE(SUM(aed.credit), 0) AS period_credit
  FROM ${accountingEntryDetails} aed
  INNER JOIN ${accountingEntries} ae ON aed.accounting_entry_id = ae.id
  WHERE ae.status = 'POSTED'
  GROUP BY aed.account_plan_id, ae.accounting_cycle_id
`);

//Saldo actual (inicial + movimientos del período) por cuenta en un ciclo activo.
export const activeAccountBalancesView = accountingSchema.view(
  'active_account_balances_view',
  {
    accountPlanId: uuid('account_plan_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    accountingCycleId: uuid('accounting_cycle_id').notNull(),
    accountCode: varchar('account_code', { length: 50 }).notNull(),
    accountName: text('account_name').notNull(),
    nature: varchar('nature', { length: 50 }).notNull(),
    initialBalance: numeric('initial_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
    periodDebit: numeric('period_debit', { precision: 20, scale: 6 }).notNull(),
    periodCredit: numeric('period_credit', {
      precision: 20,
      scale: 6,
    }).notNull(),
    currentBalance: numeric('current_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
  },
).as(sql`
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
    CASE
      WHEN ap.nature = 'DEBIT' THEN (ab.initial_balance + COALESCE(pam.period_debit, 0) - COALESCE(pam.period_credit, 0))
      WHEN ap.nature = 'CREDIT' THEN (ab.initial_balance + COALESCE(pam.period_credit, 0) - COALESCE(pam.period_debit, 0))
      ELSE 0
    END AS current_balance
  FROM ${accountBalances} ab
  INNER JOIN ${accountPlan} ap ON ab.account_plan_id = ap.id
  LEFT JOIN ${periodAccountMovementsView} pam
    ON ab.account_plan_id = pam.account_plan_id AND ab.accounting_cycles_id = pam.accounting_cycle_id
`);

//Balance contable general (suma de movimientos de todas las cuentas).
export const accountingBalance = accountingSchema.view('accounting_balance', {
  tenantId: uuid('tenant_id').notNull(),
  accountPlanId: uuid('account_plan_id').notNull(),
  accountCode: varchar('account_code', { length: 50 }).notNull(),
  accountName: text('account_name').notNull(),
  currencyCode: text('currency_code').notNull(),
  totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull(),
  balance: numeric('balance', { precision: 20, scale: 6 }).notNull(),
}).as(sql`
  SELECT
    ap.tenant_id,
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
  LEFT JOIN ${accountingEntryDetails} aed ON aed.account_plan_id = ap.id
  LEFT JOIN ${accountingEntries} ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ap.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ap.tenant_id, ap.id, ap.code, ap.name, ap.nature, COALESCE(ae.currency_code, 'VES')
`);

//Balance contable por cada cuenta bancaria (relacionada con el plan de cuentas).
export const accountingBalanceByBank = accountingSchema.view(
  'accounting_balance_by_bank',
  {
    tenantId: uuid('tenant_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    accountPlanId: uuid('account_plan_id').notNull(),
    accountCode: varchar('account_code', { length: 50 }).notNull(),
    accountName: text('account_name').notNull(),
    currencyCode: text('currency_code').notNull(),
    totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull(),
    totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull(),
    balance: numeric('balance', { precision: 20, scale: 6 }).notNull(),
  },
).as(sql`
  SELECT
    ba.tenant_id,
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
  LEFT JOIN ${accountingEntryDetails} aed ON aed.account_plan_id = ap.id
  LEFT JOIN ${accountingEntries} ae
    ON ae.id = aed.accounting_entry_id
   AND ae.tenant_id = ba.tenant_id
   AND ae.status = 'POSTED'
  GROUP BY ba.tenant_id, ba.id, ap.id, ap.code, ap.name, ap.nature,
           COALESCE(ae.currency_code, ba.currency_code)
`);


export const mvAccountBalances = accountingSchema.view(
  'mv_account_balances',
  {
    tenantId: uuid('tenant_id').notNull(),
    accountingCycleId: uuid('accounting_cycle_id').notNull(),
    accountPlanId: uuid('account_plan_id').notNull(),
    accountCode: varchar('account_code', { length: 50 }).notNull(),
    accountName: text('account_name').notNull(),
    accountType: accountTypeEnum('account_type').notNull(),
    accountNature: accountNatureEnum('account_nature').notNull(),
    level: integer('level').notNull(),
    parentAccountId: uuid('parent_account_id'),
    allowsMovements: boolean('allows_movements').notNull(),
    totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull(),
    totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull(),
    finalBalance: numeric('final_balance', { precision: 20, scale: 6 }).notNull(),
  },
).as(sql`
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
    CASE 
        WHEN ap.nature = 'DEBIT' THEN COALESCE(SUM(acd.debit - acd.credit), 0)
        WHEN ap.nature = 'CREDIT' THEN COALESCE(SUM(acd.credit - acd.debit), 0)
        ELSE COALESCE(SUM(acd.debit - acd.credit), 0)
    END AS final_balance
  FROM ${accountPlan} ap
  INNER JOIN ${accountingEntryDetails} acd ON ap.id = acd.account_plan_id
  INNER JOIN ${accountingEntries} ae 
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
`);