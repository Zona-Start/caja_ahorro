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
export const audit = t.pgTable('audit', {
  id: t.serial('id').primaryKey(),
  affectedTable: t.varchar('affected_table', { length: 100 }).notNull(), // Name of the affected table
  action: t.varchar('action', { length: 50 }).notNull(), // 'insert', 'update', 'delete'
  recordId: t.integer('record_id').notNull(), // ID of the affected record
  userId: t
    .integer('user_id')
    .references(() => users.id, { onDelete: 'set null' }), // User who performed the action
  details: t.jsonb('details'), // Additional details in JSON format
  date: t.timestamp('date').defaultNow(),
  ...timestamps,
});

//Tabla de Tipo de categorias
export const categoryType = t.pgTable(
  'category_type',
  {
    id: t.serial('id').primaryKey(),
    group: t.varchar('group', { length: 100 }).notNull(), // grupo pertenece
    description: t.text('description').notNull(), // name
    options: t.integer('options'), // opciones extras
    ...timestamps,
  },
  (categoryType) => ({
    categoryTypeIdx0: t.index('category_typeIx0').on(categoryType.group),
    categoryTypeIdx1: t.index('category_typeIx1').on(categoryType.description),
    categoryTypeIdx2: t.index('category_typeIx2').on(categoryType.options),
  }),
);

// Tabla States
export const states = t.pgTable(
  'states',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    ...timestamps,
  },
  (states) => ({
    nameIndex: t.index('states_index_00').on(states.id, states.name),
  }),
);

// Tabla Municipalities
export const municipalities = t.pgTable(
  'municipalities',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    stateId: t
      .integer('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (municipalities) => ({
    nameStateIndex: t
      .index('municipalities_index_00')
      .on(municipalities.id, municipalities.name, municipalities.stateId),
  }),
);

// Tabla Parishes
export const parishes = t.pgTable(
  'parishes',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    municipalityId: t
      .integer('municipality_id')
      .notNull()
      .references(() => municipalities.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (parishes) => ({
    parishIndex: t
      .index('parishes_index_00')
      .on(parishes.id, parishes.name, parishes.municipalityId),
  }),
);

// Tabla Localities
export const localities = t.pgTable(
  'localities',
  {
    id: t.serial('id').primaryKey(),
    stateId: t
      .integer('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'cascade' }),
    municipalityId: t
      .integer('municipality_id')
      .notNull()
      .references(() => municipalities.id, { onDelete: 'cascade' }),
    parishId: t
      .integer('parish_id')
      .notNull()
      .references(() => parishes.id, { onDelete: 'cascade' }),
    name: t.text('name').unique().notNull(),
    ...timestamps,
  },
  (localities) => ({
    uniqueLocalityIndex: t
      .uniqueIndex('localities_index_03')
      .on(localities.stateId, localities.municipalityId, localities.parishId),
    stateIndex: t.index('localities_index_00').on(localities.stateId),
    municipalityIndex: t
      .index('localities_index_01')
      .on(localities.municipalityId),
    parishIndex: t.index('localities_index_02').on(localities.parishId),
  }),
);

// // Vista LocalitiesView
// export const localitiesView = t.pgView("localities_view", {
//     id: t.integer("id").notNull(),
//     stateId: t.integer("state_id"),
//     state: t.text("state"),
//     municipalityId: t.integer("municipality_id"),
//     municipality: t.text("municipality"),
//     parishId: t.integer("parish_id"),
//     parish: t.text("parish"),
//     fullLocation: t.text("full_location"),
//   });
