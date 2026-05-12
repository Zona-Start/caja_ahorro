import {
  boolean,
  char,
  date,
  index,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import {
  bankTransactionCategory,
  currencyCodeEnum,
  internalLinkStatusEnum,
  paymentMethodEnum,
  reconciliationItemStatusEnum,
  reconciliationStatusEnum,
} from '../enum';

import { InferSelectModel } from 'drizzle-orm';
import { treasurySchema } from '../_schemas';
import {
  accountingEntries,
  accountingEntryDetails,
  accountingRules,
  accountPlan,
} from './accounting';
import { users } from './auth';
import { tenants } from './tenants';

//Directorio de entidades bancarias.
export const bankDirectory = treasurySchema.table(
  'bank_directory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 10 }).notNull().unique(), // Código SUDEBAN/SWIFT u otro identificador
    name: text('name').notNull(),
    countryCode: varchar('country_code', { length: 3 }).default('VEN'),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeIdx: index('bank_directory_code_idx').on(table.code),
    nameIdx: index('bank_directory_name_idx').on(table.name),
  }),
);

//Cuentas bancarias propias de la Company.
export const bankAccounts = treasurySchema.table(
  'bank_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    bankDirectoryId: uuid('bank_directory_id')
      .notNull()
      .references(() => bankDirectory.id, { onDelete: 'restrict' }), // Banco al que pertenece
    accountNumber: varchar('account_number', { length: 20 }).notNull().unique(), // Número de cuenta completo
    accountName: varchar('account_name', { length: 255 }),
    accountType: varchar('account_type', { length: 50 }).notNull(), // Ej: Corriente, Ahorro
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    openingDate: date('opening_date'),
    currentBalance: numeric('current_balance', {
      precision: 20,
      scale: 6,
    }).default('0.00'), //Saldo según libros (calculado o almacenado con cuidado)
    lastStatementBalance: numeric('last_statement_balance', {
      precision: 20,
      scale: 6,
    }), //Saldo del último extracto cargado
    lastStatementDate: date('last_statement_date'),
    linkedChartAccountId: uuid('linked_chart_account_id')
      .references(() => accountPlan.id, { onDelete: 'set null' })
      .notNull(), //Cuenta contable (Activo) que representa esta cuenta bancaria
    isActive: boolean('is_active').default(true).notNull(),
    openingEntryPosted: boolean('opening_entry_posted').default(false),
    ruleAccountId: uuid('rule_account_id').references(() => accountingRules.id),
    ...timestamps,
  },
  (table) => ({
    accountNumberIdx: uniqueIndex('bank_accounts_account_number_uidx').on(
      table.accountNumber,
    ),
    savingsBankIdx: index('bank_accounts_sb_idx').on(table.tenantId),
    currencyIdx: index('bank_accounts_currency_idx').on(table.currencyCode),
    linkedChartAccIdx: index('bank_accounts_chart_acc_idx').on(
      table.linkedChartAccountId,
    ),
  }),
);

//Movimientos registrados en los extractos bancarios importados.
export const bankTransactions = treasurySchema.table(
  'bank_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    bankAccountId: uuid('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'cascade' }),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    transactionDate: date('transaction_date').notNull(), // Fecha del movimiento según extracto
    valueDate: date('value_date'), // Fecha valor
    description: text('description').notNull(),
    category: bankTransactionCategory('bank_transaction_category').notNull(), //Campo para la Categoría del Movimiento
    bankReference: varchar('bank_reference', { length: 100 }), // Referencia única del banco para este movimiento
    debitAmount: numeric('debit_amount', { precision: 20, scale: 6 }).default(
      '0.00',
    ),
    creditAmount: numeric('credit_amount', { precision: 20, scale: 6 }).default(
      '0.00',
    ),
    resultingBalance: numeric('resulting_balance', { precision: 20, scale: 6 }), // Saldo después del movimiento según extracto
    reconciliationStatus: reconciliationItemStatusEnum('reconciliation_status')
      .notNull()
      .default('PENDING'),
    bankReconciliationId: uuid('bank_reconciliation_id').references(
      () => bankReconciliations.id,
      { onDelete: 'set null' },
    ), // A qué conciliación pertenece
    uploadBatchId: text('upload_batch_id'), // Para identificar el lote de carga
    uploadedAt: timestamp('uploaded_at').defaultNow(),
    accounting_entry_id: uuid('accounting_entry_id').references(
      () => accountingEntries.id,
      { onDelete: 'set null' },
    ), // Enlace si se generó un asiento directo desde aquí
    internalLinkStatus: internalLinkStatusEnum('internal_link_status')
      .notNull()
      .default('UNLINKED'), // O 'NO_APLICA' si algunas transacciones bancarias nunca se vincularán (ej., comisiones bancarias),
    note: text('note'),
    ...timestamps,
  },
  (table) => ({
    accountDateIdx: index('bank_trans_account_date_idx').on(
      table.bankAccountId,
      table.transactionDate,
    ),
    bankRefIdx: index('bank_trans_bank_ref_idx').on(
      table.bankAccountId,
      table.bankReference,
    ), // Puede ser UNIQUE si la ref es única por cuenta
    reconStatusIdx: index('bank_trans_recon_status_idx').on(
      table.reconciliationStatus,
    ),
    reconIdIdx: index('bank_trans_recon_id_idx').on(table.bankReconciliationId),
  }),
);

export type BankTransactions = InferSelectModel<typeof bankTransactions>;

export const internalTransactionBankLinks = treasurySchema.table(
  'internal_transaction_bank_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    bankTransactionId: uuid('bank_transaction_id')
      .notNull()
      .references(() => bankTransactions.id, { onDelete: 'cascade' }),

    // Polymorphic Relationship for Internal Records
    internalRecordType: varchar('internal_record_type', {
      length: 50,
    }).notNull(), // e.g., 'LOAN_PAYMENT', 'LOAN_DISBURSEMENT', 'MEMBER_WITHDRAWAL', 'MEMBER_DEPOSIT', 'GENERAL_EXPENSE', 'GENERAL_INCOME'
    internalRecordId: varchar('internal_record_id').notNull(), // El ID del registro específico en su tabla respectiva

    linkedAt: timestamp('linked_at').defaultNow(),
    linkedBy: uuid('linked_by').references(() => users.id, {
      onDelete: 'set null',
    }), // Who linked this (useful for audit)
    // Add other relevant audit fields if needed
    ...timestamps,
  },
  (table) => ({
    bankTransIdIdx: index('int_trans_links_bank_trans_id_idx').on(
      table.bankTransactionId,
    ),
    internalRecordIdx: index('int_trans_links_internal_record_idx').on(
      table.internalRecordType,
      table.internalRecordId,
    ),
  }),
);

export const bankCategoryRule = treasurySchema.table(
  'bank_category_rule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    category: bankTransactionCategory('category').notNull(),
    internalTable: varchar('internal_table', { length: 50 }), // nombre tabla interna
    recordStatus: varchar('record_status', { length: 20 }), // status que debe tener
    direction: char('direction', { length: 1 }).notNull().$type<'I' | 'O'>(), // I=entrada banco, O=salida
    defaultDebitAccountId: uuid('default_debit_account_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ),
    defaultCreditAccountId: uuid('default_credit_account_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ),
    autoList: boolean('auto_list').default(true).notNull(), // ¿la muestra en la modal de vinculación?
  },
  (table) => ({
    uniqueCatTable: uniqueIndex('bcr_cat_table_uidx').on(
      table.category,
      table.internalTable,
    ),
  }),
);

//Proceso de conciliación bancaria.
export const bankReconciliations = treasurySchema.table(
  'bank_reconciliations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    bankAccountId: uuid('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'restrict' }),
    statementDate: date('statement_date').notNull(), //Fecha de corte del extracto'
    statementEndingBalance: numeric('statement_ending_balance', {
      precision: 20,
      scale: 6,
    }).notNull(), //Saldo final según extracto
    bookBalanceBefore: numeric('book_balance_before', {
      precision: 20,
      scale: 6,
    }).notNull(), //Saldo en libros ANTES de ajustes de esta conciliación
    bookBalanceAfter: numeric('book_balance_after', {
      precision: 20,
      scale: 6,
    }), //Saldo en libros DESPUÉS de ajustes de esta conciliación
    difference: numeric('difference', { precision: 20, scale: 6 }), //Diferencia (debería ser 0 si está cuadrada)
    reconciliationDate: timestamp('reconciliation_date').defaultNow(),
    status: reconciliationStatusEnum('status').notNull().default('IN_PROGRESS'),
    preparedByUserId: uuid('prepared_by_user_id').references(() => users.id),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => ({
    accountStatementDateIdx: uniqueIndex(
      'bank_recon_account_stmt_date_uidx',
    ).on(table.bankAccountId, table.statementDate), // Una conciliación por cuenta y fecha de corte
    statusIdx: index('bank_recon_status_idx').on(table.status),
  }),
);

//Detalle de partidas conciliadas y ajustes en la conciliación.
export const bankReconciliationDetails = treasurySchema.table(
  'bank_reconciliation_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bankReconciliationId: uuid('bank_reconciliation_id')
      .notNull()
      .references(() => bankReconciliations.id, { onDelete: 'cascade' }),
    bankTransactionId: uuid('bank_transaction_id')
      .unique()
      .references(() => bankTransactions.id, { onDelete: 'set null' }), //Movimiento bancario conciliado (si aplica) // Único porque un mov. bancario solo está en una conciliación
    accountingEntryDetailId: uuid('accounting_entry_detail_id').references(
      () => accountingEntryDetails.id,
      { onDelete: 'set null' },
    ), //Movimiento en libros conciliado (si aplica)
    adjustmentType: varchar('adjustment_type', { length: 50 }), //Ej: DEPOSITO_TRANSITO, CHEQUE_TRANSITO, ERROR_BANCO, ERROR_LIBRO, NOTA_CREDITO, NOTA_DEBITO
    adjustmentAmount: numeric('adjustment_amount', {
      precision: 20,
      scale: 6,
    }),
    description: text('description'),
    isBookAdjustment: boolean('is_book_adjustment').default(false), //Indica si este item requiere un asiento de ajuste en libros
    adjustmentEntryId: uuid('adjustment_entry_id').references(
      () => accountingEntries.id,
      { onDelete: 'set null' },
    ), //Asiento contable generado para el ajuste
    ...timestamps,
  },
  (table) => ({
    reconIdx: index('bank_recon_details_recon_idx').on(
      table.bankReconciliationId,
    ),
    bankTransIdx: index('bank_recon_details_bank_trans_idx').on(
      table.bankTransactionId,
    ),
    acctEntryDetailIdx: index('bank_recon_details_acct_entry_detail_idx').on(
      table.accountingEntryDetailId,
    ),
  }),
);
