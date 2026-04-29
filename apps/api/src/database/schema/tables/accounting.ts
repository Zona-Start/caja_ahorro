import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import { accountingSchema } from '../_schemas';
import {
  accountNatureEnum,
  accountTypeEnum,
  currencyCodeEnum,
  cycleStatusEnum,
  entryStatusEnum,
} from '../enum/';
import { users } from './auth';
import { suppliers } from './purchasing';
import { associates } from './savings';
import { tenants } from './tenants';

// Tabla de Plan de cuentas  Almacena las cuentas contables de la caja de ahorro.
export const accountPlan = accountingSchema.table(
  'account_plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    code: varchar('code', { length: 50 }).notNull(), // Código contable jerárquico (ej: 1.1.01.001)
    name: text('name').notNull(), // Nombre de la cuenta (ej: "Caja Principal")
    description: text('description'), // Optional account description
    accountType: accountTypeEnum('account_type').notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE, MEMORANDUM
    nature: accountNatureEnum('nature').notNull(), // DEBIT (Deudora) o CREDIT (Acreedora)
    level: integer('level').notNull(), // Account level in the hierarchy (e.g. 1, 2, 3)
    allowsMovements: boolean('allows_movements').notNull().default(true), // True si es cuenta de detalle (imputable), False si es de agrupación,
    isActive: boolean('is_active').default(true),
    parentAccountId: uuid('parent_account_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ),
    ...timestamps,
  },
  (table) => ({
    codeSavingsBankIdx: uniqueIndex('account_plan_code_savings_bank_uidx').on(
      table.code,
      table.tenantId,
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
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: cycleStatusEnum('status').notNull().default('OPEN'), // OPEN, CLOSED, CLOSING
    description: text('description').notNull(), // Ej: "Ciclo Contable Enero 2025"
    closedByUser_id: uuid('closed_by_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }), // FK a tabla Usuarios
    closedAt: timestamp('closed_at'),
    ...timestamps,
  },
  (table) => ({
    savingsBankDateIdx: uniqueIndex('accounting_cycles_sb_start_end_uidx').on(
      table.tenantId,
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
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    accountingCycleId: uuid('accounting_cycle_id')
      .notNull()
      .references(() => accountingCycles.id, { onDelete: 'restrict' }), // No borrar ciclo si tiene asientos
    entryDate: date('entry_date').notNull(), // Fecha contable del asiento
    description: text('description').notNull(),
    voucherNo: integer('voucher_no').notNull(), // Número de comprobante correlativo
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
    id: uuid('id').primaryKey().defaultRandom(),
    accountingEntryId: uuid('accounting_entry_id')
      .notNull()
      .references(() => accountingEntries.id, { onDelete: 'cascade' }), // Si se borra la cabecera, se borran detalles
    accountPlanId: uuid('account_plan_id')
      .notNull()
      .references(() => accountPlan.id, { onDelete: 'restrict' }), // No borrar cuenta si tiene movimientos
    associateId: uuid('associate_id').references(() => associates.id, {
      onDelete: 'restrict',
    }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, {
      onDelete: 'restrict', // No puedes borrar un proveedor si tiene asientos
    }),
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
    checkOnlyOneAuxiliary: check(
      'only_one_auxiliary_check', //Un detalle del asiento no puede ser de un socio Y de un proveedor al mismo tiempo.
      sql`(${table.associateId} IS NULL OR ${table.supplierId} IS NULL)`,
    ),
    entryIdx: index('acct_entry_details_entry_idx').on(table.accountingEntryId),
    accountIdx: index('acct_entry_details_account_idx').on(table.accountPlanId),
  }),
);

export const accountBalances = accountingSchema.table(
  'account_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    accountPlanId: uuid('account_plan_id')
      .notNull()
      .references(() => accountPlan.id, { onDelete: 'cascade' }),
    accountingCyclesId: uuid('accounting_cycles_id') // puede ser el anual o el mensual
      .notNull()
      .references(() => accountingCycles.id, { onDelete: 'cascade' }),

    // Este es el campo para tu "CARGA INICIAL"
    // Es el saldo con el que la cuenta *inicia* el período.
    initialBalance: numeric('initial_balance', { precision: 20, scale: 6 })
      .notNull()
      .default('0.00'),

    // Suma de todos los `debit` de `accountingEntryDetails`
    // para esta cuenta *durante* este ciclo.
    debitBalance: numeric('debit_balance', { precision: 20, scale: 6 }).default(
      '0',
    ),
    // Suma de todos los `credit` de `accountingEntryDetails`
    // para esta cuenta *durante* este ciclo.
    creditBalance: numeric('credit_balance', {
      precision: 20,
      scale: 6,
    }).default('0'),
    // Saldo final calculado al momento del cierre.
    // (Ej: initialBalance + totalDebit - totalCredit)
    finalBalance: numeric('final_balance', { precision: 20, scale: 6 })
      .notNull()
      .default('0.00'),
    ...timestamps,
  },
  (table) => ({
    // un registro por cuenta y ciclo
    uniqueAccountCycle: unique('account_balances_unique').on(
      table.tenantId,
      table.accountPlanId,
      table.accountingCyclesId,
    ),
    cycleIdx: index('account_balances_cycle_idx').on(table.accountingCyclesId),
    accountIdx: index('account_balances_plan_idx').on(table.accountPlanId),
  }),
);

////REGLAS DE ASIENTOS AUTOMÁTICOS////
// 1. Definición de la Regla (El Evento)
export const accountingRules = accountingSchema.table('accounting_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull().default('ACCOUNTING'), // SAVINGS_BANK, ADMINISTRATIVE, BANKING, ACCOUNTING, INVENTORY
  operationType: varchar('operation_type').notNull(), // Ej: PAYROLL_CONCEPT, LOAN_APP
  referenceValue: varchar('reference_value', { length: 255 }), // Texto del valor de la selección
  description: text('description'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

// 2. Detalle de la Regla (Los Asientos automáticos)
export const accountingRuleDetails = accountingSchema.table(
  'accounting_rule_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ruleId: uuid('rule_id').references(() => accountingRules.id),
    accountRole: varchar('account_role'), // Ej: 'ASOCIADO_CUENTA', 'PATRONO_CUENTA', 'INTERES_CUENTA'
    movementType: varchar('movement_type', {
      enum: ['DEBIT', 'CREDIT'],
    }).notNull(),
    isAuxiliary: boolean('is_auxiliary').default(false),
    isAuxiliarySupplier: boolean('is_auxiliary_supplier').default(false),
    formula: text('formula'), // Opcional: para calcular montos (ej: "total * 0.05")
    accountPlanId: uuid('account_plan_id').references(() => accountPlan.id),
  },
);
