import {
  boolean,
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
import {
  accountingEntries,
  accountingEntryDetails,
  accountPlan,
} from './accounting';
import { users } from './auth';
import { company } from './core';
import {
  bankTransactionCategory,
  currencyCodeEnum,
  internalLinkStatusEnum,
  paymentMethodEnum,
  reconciliationItemStatusEnum,
  reconciliationStatusEnum,
} from './enum';
import { bankingSchema } from './schemas';

//Directorio de entidades bancarias.
export const bankDirectory = bankingSchema.table(
  'bank_directory',
  {
    id: serial('id').primaryKey(),
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
export const bankAccounts = bankingSchema.table(
  'bank_accounts',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    bankDirectoryId: integer('bank_directory_id')
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
    linkedChartAccountId: integer('linked_chart_account_id')
      .references(() => accountPlan.id, { onDelete: 'set null' })
      .notNull(), //Cuenta contable (Activo) que representa esta cuenta bancaria
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    accountNumberIdx: uniqueIndex('bank_accounts_account_number_uidx').on(
      table.accountNumber,
    ),
    savingsBankIdx: index('bank_accounts_sb_idx').on(table.companyId),
    currencyIdx: index('bank_accounts_currency_idx').on(table.currencyCode),
    linkedChartAccIdx: index('bank_accounts_chart_acc_idx').on(
      table.linkedChartAccountId,
    ),
  }),
);

//Movimientos registrados en los extractos bancarios importados.
export const bankTransactions = bankingSchema.table(
  'bank_transactions',
  {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'cascade' }),
    transactionType: paymentMethodEnum('transaction_type').notNull(),
    transactionDate: date('transaction_date').notNull(), // Fecha del movimiento según extracto
    valueDate: date('value_date'), // Fecha valor
    description: text('description').notNull(),
    category: bankTransactionCategory('bank_transaction_category'), //Campo para la Categoría del Movimiento
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
    bankReconciliationId: integer('bank_reconciliation_id').references(
      () => bankReconciliations.id,
      { onDelete: 'set null' },
    ), // A qué conciliación pertenece
    uploadBatchId: text('upload_batch_id'), // Para identificar el lote de carga
    uploadedAt: timestamp('uploaded_at').defaultNow(),
    // accounting_entry_id: integer('accounting_entry_id').references(() => accountingEntries.id, { onDelete: 'set null' }), // Enlace si se generó un asiento directo desde aquí
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

export const internalTransactionBankLinks = bankingSchema.table(
  'internal_transaction_bank_links',
  {
    id: serial('id').primaryKey(),
    bankTransactionId: integer('bank_transaction_id')
      .notNull()
      .references(() => bankTransactions.id, { onDelete: 'cascade' })
      .unique(), // One internal link per bank transaction

    // Polymorphic Relationship for Internal Records
    internalRecordType: varchar('internal_record_type', {
      length: 50,
    }).notNull(), // e.g., 'LOAN_PAYMENT', 'LOAN_DISBURSEMENT', 'MEMBER_WITHDRAWAL', 'MEMBER_DEPOSIT', 'GENERAL_EXPENSE', 'GENERAL_INCOME'
    internalRecordId: integer('internal_record_id').notNull(), // El ID del registro específico en su tabla respectiva

    linkedAt: timestamp('linked_at').defaultNow(),
    linkedBy: integer('linked_by').references(() => users.id, {
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

//Proceso de conciliación bancaria.
export const bankReconciliations = bankingSchema.table(
  'bank_reconciliations',
  {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id')
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
    preparedByUserId: integer('prepared_by_user_id').references(() => users.id),
    reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id),
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
export const bankReconciliationDetails = bankingSchema.table(
  'bank_reconciliation_details',
  {
    id: serial('id').primaryKey(),
    bankReconciliationId: integer('bank_reconciliation_id')
      .notNull()
      .references(() => bankReconciliations.id, { onDelete: 'cascade' }),
    bankTransactionId: integer('bank_transaction_id')
      .unique()
      .references(() => bankTransactions.id, { onDelete: 'set null' }), //Movimiento bancario conciliado (si aplica) // Único porque un mov. bancario solo está en una conciliación
    accountingEntryDetailId: integer('accounting_entry_detail_id').references(
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
    adjustmentEntryId: integer('adjustment_entry_id').references(
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
