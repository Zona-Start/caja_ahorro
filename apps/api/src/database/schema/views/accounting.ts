// import { sql } from 'drizzle-orm';
// import { integer, numeric, uuid, varchar } from 'drizzle-orm/pg-core';
// import { accountingSchema } from '../tables/accounting';

// /**
//  * VISTA: period_account_movements_view
//  * PROPOSITO: Acelerar el cálculo de saldos durante el cierre.
//  * Evita tener que sumar línea por línea en el código de la aplicación.
//  */
// export const periodAccountMovementsView = accountingSchema.view(
//   'period_account_movements_view',
//   {
//     accountPlanId: integer('account_plan_id').notNull(),
//     accountingCycleId: integer('accounting_cycle_id').notNull(),
//     periodDebit: numeric('period_debit').notNull(),
//     periodCredit: numeric('period_credit').notNull(),
//   },
// ).as(sql`
//   SELECT
//     aed.account_plan_id,
//     ae.accounting_cycle_id,
//     COALESCE(SUM(aed.debit), 0) AS period_debit,
//     COALESCE(SUM(aed.credit), 0) AS period_credit
//   FROM accounting.accounting_entry_details aed
//   INNER JOIN accounting.accounting_entries ae ON aed.accounting_entry_id = ae.id
//   WHERE ae.status = 'POSTED'
//   GROUP BY aed.account_plan_id, ae.accounting_cycle_id
// `);

// export const activeAccountBalancesView = accountingSchema.view(
//   'active_account_balances_view',
//   {
//     accountPlanId: uuid('account_plan_id').notNull(),
//     tenantId: uuid('tenant_id').notNull(),
//     accountingCycleId: uuid('accounting_cycle_id').notNull(),

//     accountCode: varchar('account_code', { length: 255 }).notNull(),
//     accountName: varchar('account_name', { length: 255 }).notNull(),
//     nature: varchar('nature', { length: 50 }).notNull(),

//     initialBalance: numeric('initial_balance', {
//       precision: 18,
//       scale: 2,
//     }).notNull(),

//     periodDebit: numeric('period_debit', { precision: 18, scale: 2 }).notNull(),
//     periodCredit: numeric('period_credit', {
//       precision: 18,
//       scale: 2,
//     }).notNull(),

//     currentBalance: numeric('current_balance', {
//       precision: 18,
//       scale: 2,
//     }).notNull(),
//   },
// ).as(sql`
//   SELECT
//     ab.account_plan_id,
//     ab.tenant_id,
//     ab.accounting_cycles_id AS accounting_cycle_id,
//     ap.code AS account_code,
//     ap.name AS account_name,
//     ap.nature,
//     ab.initial_balance,
//     COALESCE(pam.period_debit, 0) AS period_debit,
//     COALESCE(pam.period_credit, 0) AS period_credit,
//     CASE
//       WHEN ap.nature = 'DEBIT' THEN
//         (ab.initial_balance + COALESCE(pam.period_debit, 0) - COALESCE(pam.period_credit, 0))
//       ELSE
//         (ab.initial_balance + COALESCE(pam.period_credit, 0) - COALESCE(pam.period_debit, 0))
//     END AS current_balance
//   FROM accounting.account_balances ab
//   INNER JOIN accounting.account_plan ap ON ab.account_plan_id = ap.id
//   LEFT JOIN accounting.period_account_movements_view pam ON
//     ab.account_plan_id = pam.account_plan_id AND ab.accounting_cycles_id = pam.accounting_cycle_id
// `);
