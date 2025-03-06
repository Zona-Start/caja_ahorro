import * as t from 'drizzle-orm/pg-core';
import { accountingSchema } from './schemas';
import { savingsBank } from './box';
import { timestamps } from '../timestamps';
import { users } from './auth';
import { transaction_types } from './general';


 
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
    parent_account_id: t.integer('parent_account_id').references(() => accountPlan.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (accountPlan) => ({
    accountPlanIdx0: t.index('users_idx0').on(accountPlan.code),
    accountPlanIdx1: t.index('users_idx1').on(accountPlan.name),
    accountPlanIdx2: t.index('users_idx2').on(accountPlan.type),
  }),
);


// tabla de transaciones contables Almacena las transacciones contables.
export const transactionsCountable = accountingSchema.table('transactions_countable', {
    id: t.serial('id').primaryKey(),
    savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
    transactionTypeId: t.integer('transaction_type_id').references(() => transaction_types.id, { onDelete: 'set null' }),
    date: t.timestamp('date').notNull(),
    description: t.text('description'),
    reference: t.varchar('reference', { length: 100 }),
    userId: t.integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
});


// Table `movimientos contables` Almacena los movimientos contables asociados a cada transacción.
export const movementsCountable = accountingSchema.table('movements_countable', {
    id: t.serial('id').primaryKey(),
    transaction_id: t.integer('transaction_id').references(() => transactionsCountable.id, { onDelete: 'cascade' }),
    accountPlanId: t.integer('account_plan_id').references(() => accountPlan.id, { onDelete: 'cascade' }),
    must: t.numeric('must', { precision: 15, scale: 2 }).default('0'),
    credit: t.numeric('credit', { precision: 15, scale: 2 }).default('0'),
    description: t.text('description'),
    ...timestamps,
});



// Tabla `balances contables` Almacena los balances generados periódicamente (mensual, anual, etc.).
export const balancesCountable = accountingSchema.table('balances_countable', {
    id: t.serial('id').primaryKey(),
    savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
    start_date: t.date('start_date').notNull(),
    end_date: t.date('end_date').notNull(),
    type: t.varchar('type', { length: 50 }).notNull(), // Ex: 'monthly', 'annual'
    total_assets: t.numeric('total_assets', { precision: 15, scale: 2 }),
    total_liabilities: t.numeric('total_liabilities', { precision: 15, scale: 2 }),
    total_equity: t.numeric('total_assets', { precision: 15, scale: 2 }),
    ...timestamps,
});
    
//  tabla `reportes contables`  Almacena los reportes generados por el sistema (balance general, estado de resultados, etc.).
export const reportsCountable = accountingSchema.table('reports_countable', {
    id: t.serial('id').primaryKey(),
    savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
    type: t.varchar('type', { length: 50 }).notNull(), // Eg: 'general_balance', 'results_status'
    generation_date: t.timestamp('generation_date').defaultNow(),
    content: t.jsonb('content'), // Stores the report content in JSON format
});


