import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import { coreSchema } from '../_schemas';
import * as enums from '../enum'; // Importa tus enums
import { tenants } from './tenants';

// === GLOBAL SETTINGS ===
export const globalSettings = coreSchema.table(
  'global_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: text('value'),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull().default('general'),
    isEncrypted: boolean('is_encrypted').default(false),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('global_settings_key_idx').on(table.key),
    index('global_settings_category_idx').on(table.category),
  ],
);

// === MODULE SETTINGS ===
export const moduleSettings = coreSchema.table(
  'module_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    module: varchar('module', { length: 50 }).notNull(),
    submodule: varchar('submodule', { length: 50 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value'),
    description: text('description'),
    isEncrypted: boolean('is_encrypted').default(false),
    isActive: boolean('is_active').default(true),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('module_settings_tenant_idx').on(table.tenantId),
    index('module_settings_module_idx').on(table.tenantId, table.module),
    uniqueIndex('module_settings_composite_key_uidx').on(
      table.tenantId,
      table.module,
      table.submodule,
      table.key,
    ),
  ],
);

//Definición de monedas disponibles en el sistema.
export const currencies = coreSchema.table('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: enums.currencyCodeEnum('code').notNull().unique(), // Ej: VES, USD
  name: varchar('name', { length: 100 }).notNull(), // Ej: Bolívar Soberano, Dólar Americano
  symbol: varchar('symbol', { length: 5 }), // Ej: Bs., $
  decimalPlaces: integer('decimal_places').notNull().default(2),
  isActive: boolean('is_active').default(true),
  isBase: boolean('is_base').default(false),
  ...timestamps,
});

//Registro histórico de tasas de cambio.
export const exchangeRates = coreSchema.table(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),


    currencyId: uuid('currency_id')
      .notNull()
      .references(() => currencies.id, { onDelete: 'cascade' }),
    rate: varchar('rate', { length: 20 }).notNull(),
    source: varchar('source', { length: 50 }).default('MANUAL'),
    isAutomatic: boolean('is_automatic').default(false),
    fetchedAt: timestamp('fetched_at'),
    ...timestamps,
  },
  (table) => [
    index('exchange_rates_currency_idx').on(table.currencyId),
    index('exchange_rates_date_idx').on(table.fetchedAt),
  ],
);

//Tabla genérica para clasificaciones y tipos (Tipos de Nómina, Tipos de Trabajador, Frecuencia Descuento, etc).
export const categories = coreSchema.table(
  'categories', // Plural
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(), // Ej: 'PAYROLL_TYPE', 'WORKER_TYPE', 'DISCOUNT_FREQ', 'ASSOCIATE_ACCOUNT_TYPE'
    description: text('description'), // Nombre legible
    options: jsonb('options'), // Opciones extra en formato JSON si es necesario
    isActive: boolean('is_active').default(true),
    ...timestamps,
  },
  (table) => [
    index('categories_type_idx').on(table.type),
    index('categories_code_idx').on(table.type, table.code),
    index('categories_active_idx').on(table.type, table.isActive),
  ],
);

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

export const processedEvents = coreSchema.table(
  'processed_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    handlerName: varchar('handler_name', { length: 100 }).notNull(),
    processedAt: timestamp('processed_at').defaultNow().notNull(),
  },
  (table) => ({
    eventHandlerIdx: uniqueIndex('processed_events_event_handler_idx').on(
      table.eventId,
      table.handlerName,
    ),
    aggregateIdx: index('processed_events_aggregate_idx').on(table.aggregateId),
    eventTypeIdx: index('processed_events_type_idx').on(table.eventType),
  }),
);

export const eventStore = coreSchema.table(
  'event_store',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    tenantId: uuid('tenant_id'),
    payload: jsonb('payload'),
    envelope: jsonb('envelope').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    storeAggregateIdx: index('event_store_aggregate_idx').on(table.aggregateId),
    storeEventTypeIdx: index('event_store_type_idx').on(table.eventType),
    storeTenantIdx: index('event_store_tenant_idx').on(table.tenantId),
    storeCreatedIdx: index('event_store_created_idx').on(table.createdAt),
  }),
);

export const deadLetterQueue = coreSchema.table(
  'dead_letter_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    tenantId: uuid('tenant_id'),
    payload: jsonb('payload'),
    envelope: jsonb('envelope').notNull(),
    handlerName: varchar('handler_name', { length: 100 }).notNull(),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    status: varchar('status', { length: 20 }).notNull().default('FAILED'),
    failedAt: timestamp('failed_at').defaultNow().notNull(),
    lastRetryAt: timestamp('last_retry_at'),
  },
  (table) => ({
    dlqEventIdIdx: index('dlq_event_id_idx').on(table.eventId),
    dlqAggregateIdx: index('dlq_aggregate_idx').on(table.aggregateId),
    dlqHandlerIdx: index('dlq_handler_idx').on(table.handlerName),
    dlqStatusIdx: index('dlq_status_idx').on(table.status),
  }),
);

export const eventOutbox = coreSchema.table(
  'event_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    tenantId: uuid('tenant_id'),
    payload: jsonb('payload'),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    sentAt: timestamp('sent_at'),
  },
  (table) => ({
    outboxStatusIdx: index('outbox_status_idx').on(table.status),
    outboxEventTypeIdx: index('outbox_event_type_idx').on(table.eventType),
    outboxAggregateIdx: index('outbox_aggregate_idx').on(table.aggregateId),
  }),
);

export const projectionCheckpoints = coreSchema.table(
  'projection_checkpoints',
  {
    projectionName: varchar('projection_name', { length: 100 }).primaryKey(),
    lastEventId: uuid('last_event_id'),
    lastEventCreatedAt: timestamp('last_event_created_at'),
    processedAt: timestamp('processed_at').defaultNow().notNull(),
  },
);

export const projectionLoanBalances = coreSchema.table(
  'projection_loan_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    loanId: uuid('loan_id').notNull(),
    associateId: uuid('associate_id'),
    associateName: varchar('associate_name', { length: 200 }),
    totalAmount: numeric('total_amount', { precision: 20, scale: 6 }).notNull().default('0'),
    paidAmount: numeric('paid_amount', { precision: 20, scale: 6 }).notNull().default('0'),
    pendingBalance: numeric('pending_balance', { precision: 20, scale: 6 }).notNull().default('0'),
    status: varchar('status', { length: 20 }),
    lastEventId: uuid('last_event_id'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    loanTenantIdx: uniqueIndex('proj_loan_tenant_loan_idx').on(table.tenantId, table.loanId),
  }),
);

export const projectionInventoryStock = coreSchema.table(
  'projection_inventory_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemType: varchar('item_type', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 200 }),
    currentQuantity: numeric('current_quantity', { precision: 20, scale: 6 }).notNull().default('0'),
    committedQuantity: numeric('committed_quantity', { precision: 20, scale: 6 }).notNull().default('0'),
    availableQuantity: numeric('available_quantity', { precision: 20, scale: 6 }).notNull().default('0'),
    lastEventId: uuid('last_event_id'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    stockItemIdx: uniqueIndex('proj_stock_item_idx').on(table.tenantId, table.itemId, table.itemType),
  }),
);

export const projectionLedgerBalances = coreSchema.table(
  'projection_ledger_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    accountPlanId: uuid('account_plan_id').notNull(),
    accountCode: varchar('account_code', { length: 50 }),
    accountName: varchar('account_name', { length: 200 }),
    cycleId: uuid('cycle_id'),
    totalDebit: numeric('total_debit', { precision: 20, scale: 6 }).notNull().default('0'),
    totalCredit: numeric('total_credit', { precision: 20, scale: 6 }).notNull().default('0'),
    balance: numeric('balance', { precision: 20, scale: 6 }).notNull().default('0'),
    lastEventId: uuid('last_event_id'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ledgerIdx: uniqueIndex('proj_ledger_idx').on(table.tenantId, table.accountPlanId, table.cycleId),
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
