// import * as t from 'drizzle-orm/pg-core';
// import { timestamps } from '../timestamps';
// import { transactionsCountable } from './accounting';
// import { associates } from './box';
// import { boxSchema } from './schemas';

// //Tabla prestamos Almacena la información de los préstamos otorgados a los asociados.
// export const loans = boxSchema.table('loans', {
//   id: t.serial('id').primaryKey(),
//   associatedIid: t
//     .integer('associated_id')
//     .references(() => associates.id, { onDelete: 'cascade' }),
//   amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
//   interest_rate: t
//     .numeric('interest_rate', { precision: 5, scale: 2 })
//     .notNull(),
//   term_months: t.integer('term_months').notNull(),
//   approval_date: t.timestamp('approval_date').defaultNow(),
//   status: t.varchar('status', { length: 50 }).notNull(), // Ex: 'approved', 'paid', 'cancelled'
//   transactionCountableId: t
//     .integer('transaction_countable_id')
//     .references(() => transactionsCountable.id, { onDelete: 'set null' }),
// });

// //Tabla pagos_prestamos Registra los pagos realizados por los asociados para amortizar los préstamos.
// export const loanPayments = boxSchema.table('loan_payments', {
//   id: t.serial('id').primaryKey(),
//   loan_id: t
//     .integer('loan_id')
//     .references(() => loans.id, { onDelete: 'cascade' }),
//   amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
//   payment_date: t.timestamp('payment_date').defaultNow(),
//   transactionCountableId: t
//     .integer('transaction_countable_id')
//     .references(() => transactionsCountable.id, { onDelete: 'set null' }),
//   ...timestamps,
// });
