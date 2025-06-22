import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps, timestampsShort } from '../timestamps';
import { accountPlan } from './accounting';
import * as enums from './enum'; // Importa tus enums
import { coreSchema } from './schemas';

//Información general de la Compañia.
export const company = coreSchema.table(
  'company', // Company
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    rif: varchar('rif', { length: 20 }).unique().notNull(),
    address: text('address'),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 100 }).unique(),
    contactPerson: text('contact_person'),
    contactPhone: varchar('contact_phone', { length: 50 }),
    contactEmail: varchar('contact_email', { length: 100 }),
    ...timestampsShort,
  },
  (table) => ({
    nameIdx: index('company_name_idx').on(table.name),
    rifIdx: uniqueIndex('company_rif_uidx').on(table.rif), // Asegurar unicidad a nivel DB
  }),
);

//Configuraciones generales del sistema (ej: Tasa de interés por mora, etc.)
export const systemSettings = coreSchema.table('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(), // La clave debe ser única
  value: text('value').notNull(), // Valor de la clave
  description: text('description'), // Descripción de funcionalidad
  group: varchar('group', { length: 100 }), // Agrupación de la configuración (ej: 'INTEREST', 'FEES', etc.)
  ...timestamps,
});

//Definición de monedas disponibles en el sistema.
export const currencies = coreSchema.table('currencies', {
  id: serial('id').primaryKey(),
  code: enums.currencyCodeEnum('code').notNull().unique(), // Ej: VES, USD
  name: varchar('name', { length: 100 }).notNull(), // Ej: Bolívar Soberano, Dólar Americano
  symbol: varchar('symbol', { length: 5 }), // Ej: Bs., $
  decimalPlaces: integer('decimal_places').notNull().default(2),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

//Registro histórico de tasas de cambio.
export const exchangeRates = coreSchema.table(
  'exchange_rates',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    fromCurrencyCode: enums.currencyCodeEnum('from_currency_code').notNull(), //.references(() => currencies.code), // FK si code es PK/Unique en currencies
    toCurrencyCode: enums.currencyCodeEnum('to_currency_code').notNull(), //.references(() => currencies.code),
    rate: numeric('rate', { precision: 20, scale: 6 }).notNull(), // Tasa de conversión (1 FROM = rate TO)
    source: varchar('source', { length: 50 }), // Ej: BCV, Monitor Dolar, Manual
    ...timestamps,
  },
  (table) => ({
    dateCurrencyIdx: uniqueIndex('exchange_rates_date_from_to_uidx').on(
      table.date,
      table.fromCurrencyCode,
      table.toCurrencyCode,
    ), // Tasa única por día y par
  }),
);

//Tabla genérica para clasificaciones y tipos (Tipos de Nómina, Tipos de Trabajador, Frecuencia Descuento, etc).
export const categoryType = coreSchema.table(
  'category_types', // Plural
  {
    id: serial('id').primaryKey(),
    group: varchar('group', { length: 100 }).notNull(), // Ej: 'PAYROLL_TYPE', 'WORKER_TYPE', 'DISCOUNT_FREQ', 'ASSOCIATE_ACCOUNT_TYPE'
    description: text('description').notNull(), // Nombre legible
    options: jsonb('options'), // Opciones extra en formato JSON si es necesario
    isActive: boolean('is_active').default(true),
    ...timestamps,
  },
  (table) => ({
    groupDescIdx: index('category_types_group_desc_idx').on(
      table.group,
      table.description,
    ),
  }),
);

//Tabla de tipos de operaciones (Ej: Aportes, Retiro, Préstamo, etc.)
export const typePayrolls = coreSchema.table('type_payrolls', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull(),
  description: text('description').notNull(),
  deferredDate: date('deferred_date'),
  dateCanceled: date('date_canceled'),
  deferredNumber: integer('deferred_number'),
  numberCanceled: integer('number_canceled'),
  group: varchar('group', { length: 100 }).notNull(), // Ej: 'PAYROLL_TYPE', 'WORKER_TYPE', 'DISCOUNT_FREQ', 'ASSOCIATE_ACCOUNT_TYPE'
  metadata: jsonb('metadata'), // Opciones extra en formato JSON si es necesario
  associatedAccount: integer('associated_account').references(
    () => accountPlan.id,
    { onDelete: 'set null' },
  ),
  employerAccount: integer('employer_account').references(
    () => accountPlan.id,
    { onDelete: 'set null' },
  ),
  loanAccount: integer('loan_account').references(() => accountPlan.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

// Tabla Estados
export const states = coreSchema.table(
  'states',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    ...timestamps,
  },
  (states) => ({
    nameIndex: index('states_name_idx').on(states.id, states.name),
  }),
);

// Tabla Municipios
export const municipalities = coreSchema.table(
  'municipalities',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    stateId: integer('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (municipalities) => ({
    nameStateIndex: index('municipalities_index_idx').on(
      municipalities.id,
      municipalities.name,
      municipalities.stateId,
    ),
  }),
);

// Tabla Parroquia
export const parishes = coreSchema.table(
  'parishes',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    municipalityId: integer('municipality_id')
      .notNull()
      .references(() => municipalities.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (parishes) => ({
    parishIndex: index('parishes_index_idx').on(
      parishes.id,
      parishes.name,
      parishes.municipalityId,
    ),
  }),
);

// Tabla Localidades
export const localities = coreSchema.table(
  'localities',
  {
    id: serial('id').primaryKey(),
    stateId: integer('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'cascade' }),
    municipalityId: integer('municipality_id')
      .notNull()
      .references(() => municipalities.id, { onDelete: 'cascade' }),
    parishId: integer('parish_id')
      .notNull()
      .references(() => parishes.id, { onDelete: 'cascade' }),
    name: text('name').unique().notNull(),
    ...timestamps,
  },
  (localities) => ({
    uniqueLocalityIndex: uniqueIndex('localities_index_idx').on(
      localities.stateId,
      localities.municipalityId,
      localities.parishId,
    ),
    stateIndex: index('localities_index_00').on(localities.stateId),
    municipalityIndex: index('localities_index_idx01').on(
      localities.municipalityId,
    ),
    parishIndex: index('localities_index_idx02').on(localities.parishId),
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
