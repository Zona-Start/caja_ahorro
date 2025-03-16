import * as t from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { users } from './auth';
import { transaction_types } from './general';
import { savingsBank } from './saving-banks';
import { accountingSchema } from './schemas';

// Tabla de Plan de cuentas  Almacena las cuentas contables de la caja de ahorro.
export const accountPlan = accountingSchema.table(
  'account_plan',
  {
    id: t.serial('id').primaryKey(),
    savingBankId: t
      .integer('saving_bank_id')
      .references(() => savingsBank.id, { onDelete: 'cascade' }),
    code: t.varchar('code', { length: 50 }).notNull(), // Account code (e.g. 1.1.1)
    name: t.text('name').notNull(), // Account name (e.g. "Caja")
    type: t.varchar('type', { length: 50 }).notNull(), // Account type: 'activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto'
    description: t.text('description'), // Optional account description
    level: t.integer('level').notNull(), // Account level in the hierarchy (e.g. 1, 2, 3)
    parent_account_id: t
      .integer('parent_account_id')
      .references(() => accountPlan.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (accountPlan) => ({
    accountPlanIdx0: t.index('account_planx0').on(accountPlan.code),
    accountPlanIdx1: t.index('account_planx1').on(accountPlan.name),
    accountPlanIdx2: t.index('account_planx2').on(accountPlan.type),
  }),
);

// tabla de transaciones contables Almacena las transacciones contables.
export const transactionsCountable = accountingSchema.table(
  'transactions_countable',
  {
    id: t.serial('id').primaryKey(),
    savingsBankId: t
      .integer('savings_bank_id')
      .references(() => savingsBank.id, { onDelete: 'cascade' }), //id de la caja
    transactionTypeId: t
      .integer('transaction_type_id')
      .references(() => transaction_types.id, { onDelete: 'set null' }), //id tipo de transacion
    date: t.date('date').notNull(), //fecha de la trasacion
    description: t.text('description'), //descripcion de la transaccion
    reference: t.bigint('reference', { mode: 'bigint' }), // numero de referencia
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'set null' }), // id usuario que hace la trasancia
    ...timestamps,
  },
  (transactionsCountable) => ({
    transactionsCountableIdx0: t
      .index('transactions_countablex0')
      .on(transactionsCountable.date),
    transactionsCountableIdx1: t
      .index('transactions_countablex1')
      .on(transactionsCountable.description),
    transactionsCountableIdx2: t
      .index('transactions_countablex2')
      .on(transactionsCountable.transactionTypeId),
    transactionsCountableIdx3: t
      .index('transactions_countablex3')
      .on(transactionsCountable.reference),
  }),
);

// Table `movimientos contables` Almacena los movimientos contables asociados a cada transacción.
export const movementsCountable = accountingSchema.table(
  'movements_countable',
  {
    id: t.serial('id').primaryKey(),
    transactionId: t
      .bigint('transaction_id', { mode: 'bigint' })
      .references(() => transactionsCountable.id, { onDelete: 'cascade' }), //id de la transacion
    accountPlanId: t
      .integer('account_plan_id')
      .references(() => accountPlan.id, { onDelete: 'cascade' }), //id de la cuenta contable
    debit: t.numeric('must', { precision: 15, scale: 2 }).default('0'), //debe
    havings: t.numeric('credit', { precision: 15, scale: 2 }).default('0'), //haber
    description: t.text('description'), //descripcion
    ...timestamps,
  },
  (movementsCountable) => ({
    movementsCountableIdx0: t
      .index('movements_countablex0')
      .on(movementsCountable.transactionId),
    movementsCountableIdx1: t
      .index('movements_countablex1')
      .on(movementsCountable.accountPlanId),
    movementsCountableIdx2: t
      .index('movements_countablex2')
      .on(movementsCountable.debit),
    movementsCountableIdx3: t
      .index('movements_countablex3')
      .on(movementsCountable.havings),
  }),
);

// // Tabla `balances contables` Almacena los balances generados periódicamente (mensual, anual, etc.).
// export const balancesCountable = accountingSchema.table('balances_countable', {
//     id: t.serial('id').primaryKey(),
//     savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
//     start_date: t.date('start_date').notNull(),
//     end_date: t.date('end_date').notNull(),
//     type: t.varchar('type', { length: 50 }).notNull(), // Ex: 'monthly', 'annual'
//     total_assets: t.numeric('total_assets', { precision: 15, scale: 2 }),
//     total_liabilities: t.numeric('total_liabilities', { precision: 15, scale: 2 }),
//     total_equity: t.numeric('total_assets', { precision: 15, scale: 2 }),
//     ...timestamps,
// });

// //  tabla `reportes contables`  Almacena los reportes generados por el sistema (balance general, estado de resultados, etc.).
// export const reportsCountable = accountingSchema.table('reports_countable', {
//     id: t.serial('id').primaryKey(),
//     savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
//     type: t.varchar('type', { length: 50 }).notNull(), // Eg: 'general_balance', 'results_status'
//     generation_date: t.timestamp('generation_date').defaultNow(),
//     content: t.jsonb('content'), // Stores the report content in JSON format
// });
