import * as t from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { users } from './auth';


// tabla para los tipos 
export const transaction_types = t.pgTable('transaction_types', {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 100 }).notNull(), // Ex: 'deposit', 'withdrawal', 'loan', 'loan_payment'
    description: t.text('description'),
    ...timestamps,
});


//Tabla de Auditoría registrará todos los cambios importantes en las transacciones financieras, como inserciones, actualizaciones o eliminaciones.
export const audit =  t.pgTable('audit', {
    id: t.serial('id').primaryKey(),
    affectedTable: t.varchar('affected_table', { length: 100 }).notNull(), // Name of the affected table
    action: t.varchar('action', { length: 50 }).notNull(), // 'insert', 'update', 'delete'
    recordId: t.integer('record_id').notNull(), // ID of the affected record
    userId: t.integer('user_id').references(() => users.id, { onDelete: 'set null' }), // User who performed the action
    details: t.jsonb('details'), // Additional details in JSON format
    date: t.timestamp('date').defaultNow(),
});