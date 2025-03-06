import * as t from 'drizzle-orm/pg-core';
import { boxSchema } from './schemas';
import { timestamps } from '../timestamps';
import { transaction_types } from './general';
import { transactionsCountable } from './accounting';


// Tabla de Datos Caja de ahorro
export const savingsBank = boxSchema.table(
  'savings_bank',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    rif: t.text('rif').unique().notNull(),
    address: t.text('address').notNull(),
    phone: t.text('phone'),
    email: t.text('email').unique().notNull(),
    personContact: t.text('person_contact'),
    phoneContact: t.text('phone_contact'),
    ...timestamps,
  },
  (savingsBank) => ({
    savingsBankIdx0: t.index('savings_bank_idx0').on(savingsBank.name),
    savingsBankIdx1: t.index('savings_bank_idx1').on(savingsBank.rif),
  }),
);



// Tabla de los asociados. Almacena la información de los asociados de la caja de ahorro.
export const associates = boxSchema.table('associates', {
    id: t.serial('id').primaryKey(),
    savingsBankId: t.integer('savings_bank_id').references(() => savingsBank.id, { onDelete: 'cascade' }),
    name: t.varchar('name', { length: 255 }).notNull(),
    identification: t.varchar('identification', { length: 20 }).notNull().unique(),
    address: t.text('address'),
    phone: t.varchar('phone', { length: 15 }),
    email: t.varchar('email', { length: 100 }),
    ...timestamps,
});

//Tabla de cuentas de los asociados  Almacena las cuentas de ahorro de los asociados.
export const accountsAssociates = boxSchema.table('accounts_associates', {
    id: t.serial('id').primaryKey(),
    associatedId: t.integer('associated_id').references(() => associates.id, { onDelete: 'cascade' }),
    balance: t.numeric('balance', { precision: 15, scale: 2 }).default('0'),
    openingDate: t.timestamp('opening_date').defaultNow(),
    status: t.varchar('status', { length: 50 }).notNull(), // Ex: 'active', 'inactive', 'locked'
    ...timestamps,
});

//Tabla transacciones_ahorro Registra las transacciones de depósitos y retiros de las cuentas de ahorro.
export const transactionsAssociates = boxSchema.table('transactions_associates', {
    id: t.serial('id').primaryKey(),
    accountsAssociatedId: t.integer('accounts_associated_id').references(() => accountsAssociates.id, { onDelete: 'cascade' }),
    transactionTypeId: t.integer('transaction_type_id').references(() => transaction_types.id, { onDelete: 'set null' }),
    amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
    date: t.timestamp('date').defaultNow(),
    description: t.text('description'),
    transactionCountableId: t.integer('transaction_countable_id').references(() => transactionsCountable.id, { onDelete: 'set null' }),
    ...timestamps,
});


//Tabla prestamos Almacena la información de los préstamos otorgados a los asociados.
export const loans = boxSchema.table('loans', {
    id: t.serial('id').primaryKey(),
    associatedIid: t.integer('associated_id').references(() => associates.id, { onDelete: 'cascade' }),
    amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
    interest_rate: t.numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
    term_months: t.integer('term_months').notNull(),
    approval_date: t.timestamp('approval_date').defaultNow(),
    status: t.varchar('status', { length: 50 }).notNull(), // Ex: 'approved', 'paid', 'cancelled' 
    transactionCountableId: t.integer('transaction_countable_id').references(() => transactionsCountable.id, { onDelete: 'set null' }),
});

//Tabla pagos_prestamos Registra los pagos realizados por los asociados para amortizar los préstamos.
export const loanPayments = boxSchema.table('loan_payments', {
    id: t.serial('id').primaryKey(),
    loan_id: t.integer('loan_id').references(() => loans.id, { onDelete: 'cascade' }),
    amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
    payment_date: t.timestamp('payment_date').defaultNow(),
    transactionCountableId: t.integer('transaction_countable_id').references(() => transactionsCountable.id, { onDelete: 'set null' }),
    ...timestamps,
});