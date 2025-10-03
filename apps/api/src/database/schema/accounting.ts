import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { users } from './auth';

import { sql } from 'drizzle-orm';
import { company } from './core';
import {
  accountNatureEnum,
  accountTypeEnum,
  currencyCodeEnum,
  cycleStatusEnum,
  entryStatusEnum,
} from './enum';
import { accountingSchema } from './schemas';

// Tabla de Plan de cuentas  Almacena las cuentas contables de la caja de ahorro.
export const accountPlan = accountingSchema.table(
  'account_plan',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id').references(() => company.id, {
      onDelete: 'cascade',
    }),
    code: varchar('code', { length: 50 }).notNull(), // Código contable jerárquico (ej: 1.1.01.001)
    name: text('name').notNull(), // Nombre de la cuenta (ej: "Caja Principal")
    description: text('description'), // Optional account description
    accountType: accountTypeEnum('account_type').notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE, MEMORANDUM
    nature: accountNatureEnum('nature').notNull(), // DEBIT (Deudora) o CREDIT (Acreedora)
    level: integer('level').notNull(), // Account level in the hierarchy (e.g. 1, 2, 3)
    allowsMovements: boolean('allows_movements').notNull().default(true), // True si es cuenta de detalle (imputable), False si es de agrupación,
    isActive: boolean('is_active').default(true),
    parentAccountId: integer('parent_account_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ),
    ...timestamps,
  },
  (table) => ({
    codeSavingsBankIdx: uniqueIndex('account_plan_code_savings_bank_uidx').on(
      table.code,
      table.companyId,
    ), // Código único por caja
    nameIdx: index('account_plan_name_idx').on(table.name),
    typeIdx: index('account_plan_type_idx').on(table.accountType),
    parentIdx: index('account_plan_parent_idx').on(table.parentAccountId),
  }),
);

//Define los periodos/ciclos contables.
export const accountingCycles = accountingSchema.table(
  'accounting_cycles',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: cycleStatusEnum('status').notNull().default('OPEN'), // OPEN, CLOSED, CLOSING
    description: text('description').notNull(), // Ej: "Ciclo Contable Enero 2025"
    closedByUser_id: integer('closed_by_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }), // FK a tabla Usuarios
    closedAt: timestamp('closed_at'),
    ...timestamps,
  },
  (table) => ({
    savingsBankDateIdx: uniqueIndex('accounting_cycles_sb_start_end_uidx').on(
      table.companyId,
      table.startDate,
      table.endDate,
    ), // Ciclo único por caja y fechas
    statusIdx: index('accounting_cycles_status_idx').on(table.status),
  }),
);

//Cabecera de los asientos contables (comprobantes).
export const accountingEntries = accountingSchema.table(
  // Renombrado de transactionsCountable
  'accounting_entries',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    accountingCycleId: integer('accounting_cycle_id')
      .notNull()
      .references(() => accountingCycles.id, { onDelete: 'restrict' }), // No borrar ciclo si tiene asientos
    entryDate: date('entry_date').notNull(), // Fecha contable del asiento
    description: text('description').notNull(),
    originReferenceId: text('origin_reference_id'), // ID de la operación origen (loan_id, payment_id, etc.)
    originType: varchar('origin_type', { length: 50 }), // Tipo de operación origen ('LOAN_DISBURSEMENT', 'BANK_DEPOSIT', 'MANUAL_ENTRY')
    status: entryStatusEnum('status').notNull().default('DRAFT'), // Estado del asiento ej. PENDING, POSTED, CANCELLED
    postedAt: timestamp('posted_at'),
    currencyCode: currencyCodeEnum('currency_code').notNull(), //Moneda del asiento (generalmente la base)
    // total_debit: numeric('total_debit', { precision: 18, scale: 2 }), // Opcional, calculado o almacenado
    // total_credit: numeric('total_credit', { precision: 18, scale: 2 }), // Opcional, calculado o almacenado
    ...timestamps,
  },
  (table) => ({
    cycleDateIdx: index('accounting_entries_cycle_date_idx').on(
      table.accountingCycleId,
      table.entryDate,
    ),
    originIdx: index('accounting_entries_origin_idx').on(
      table.originType,
      table.originReferenceId,
    ),
    statusIdx: index('accounting_entries_status_idx').on(table.status),
  }),
);

// Líneas de detalle de cada asiento contable (Debe y Haber).
export const accountingEntryDetails = accountingSchema.table(
  // Renombrado de movementsCountable
  'accounting_entry_details',
  {
    id: serial('id').primaryKey(),
    accountingEntryId: integer('accounting_entry_id')
      .notNull()
      .references(() => accountingEntries.id, { onDelete: 'cascade' }), // Si se borra la cabecera, se borran detalles
    accountPlanId: integer('account_plan_id')
      .notNull()
      .references(() => accountPlan.id, { onDelete: 'restrict' }), // No borrar cuenta si tiene movimientos
    debit: numeric('debit', { precision: 20, scale: 6 })
      .notNull()
      .default('0.00'),
    credit: numeric('credit', { precision: 20, scale: 6 })
      .notNull()
      .default('0.00'),
    description: text('description'),
    ...timestamps, // No usual tener timestamps aquí, pero Drizzle lo permite
  },
  (table) => ({
    checkDebitCredit: check(
      'debit_credit_check',
      sql`(${table.debit} > 0 AND ${table.credit} = 0) OR (${table.debit} = 0 AND ${table.credit} > 0) OR (${table.debit} = 0 AND ${table.credit} = 0)`,
    ), // Permitir 0 en ambos para ajustes? Revisar. Idealmente no.
    checkAmountPositive: check(
      'amount_positive_check',
      sql`${table.debit} >= 0 AND ${table.credit} >= 0`,
    ), // Asegurar no negativos
    entryIdx: index('acct_entry_details_entry_idx').on(table.accountingEntryId),
    accountIdx: index('acct_entry_details_account_idx').on(table.accountPlanId),
  }),
);

//Parametrización de asientos contables por tipo de operación.
export const accountingConfiguration = accountingSchema.table(
  'accounting_configuration',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    operationType: varchar('operation_type', { length: 100 }).notNull(), //Ej: LOAN_DISBURSEMENT_VES, SAVING_CONTRIBUTION_USD, INTEREST_ACCRUAL
    descriptionTemplate: text('description_template'), //Plantilla para descripción del asiento. Ej: "Desembolso Préstamo #{loanId}
    debitAccountId: integer('debit_account_id').references(
      () => accountPlan.id,
      { onDelete: 'restrict' },
    ),
    creditAccountId: integer('credit_account_id').references(
      () => accountPlan.id,
      { onDelete: 'restrict' },
    ),
    contraAccountId: integer('contra_account_id').references(
      () => accountPlan.id, //contra partida para ajustes
    ),
    is_active: boolean('is_active').default(true),
    ...timestamps,
  },
  (table) => ({
    savingsBankOperationIdx: uniqueIndex('acct_config_sb_op_type_uidx').on(
      table.companyId,
      table.operationType,
    ), // Configuración única por caja y tipo de operación
  }),
);
