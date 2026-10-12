import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { savingsSchema } from '../_schemas';

/**
 * Subconjunto de SOLO LECTURA de tablas `savings.*` usadas por el portal
 * (opción A: definición propia, sin tocar `apps/api`). Los tipos enum del ERP
 * se modelan como `text` (node-postgres los devuelve como texto).
 *
 * Nombres de columnas replicados EXACTAMENTE del ERP (incluidas rarezas como
 * 'Installment_amount').
 */

// --- associate_accounts ------------------------------------------------------
export const associateAccounts = savingsSchema.table(
  'associate_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    associateId: uuid('associate_id'),
    accountNumber: varchar('account_number', { length: 20 }),
    currencyCode: text('currency_code').notNull(),
    balance: numeric('balance', { precision: 20, scale: 6 }).notNull(),
    openingDate: date('opening_date'),
    closingDate: date('closing_date'),
    bankDirectoryId: uuid('bank_id'),
    status: text('status').notNull(),
  },
  (table) => [index('associate_accounts_associate_idx').on(table.associateId)],
);

// --- associate_account_movements --------------------------------------------
export const associateAccountMovements = savingsSchema.table(
  'associate_account_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    associateAccountId: uuid('associate_account_id').notNull(),
    movementType: text('movement_type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
    currencyCode: text('currency_code').notNull(),
    transactionDate: timestamp('transaction_date').notNull().defaultNow(),
    description: text('description'),
    referenceId: text('reference_id'),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceNumber: varchar('reference_number', { length: 20 }),
    internalCode: varchar('internal_code', { length: 30 }),
    status: text('status').notNull(),
  },
  (table) => [
    index('assoc_acct_mov_account_idx').on(table.associateAccountId),
    index('assoc_acct_mov_type_idx').on(table.movementType),
  ],
);

// --- withdrawal_types --------------------------------------------------------
export const withdrawalTypes = savingsSchema.table('withdrawal_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  isHouseComercial: boolean('is_house_comercial').notNull().default(false),
  isInternalInventory: boolean('is_internal_inventory')
    .notNull()
    .default(false),
});

// --- withdrawals_associates --------------------------------------------------
export const withdrawalsAssociates = savingsSchema.table(
  'withdrawals_associates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    associateAccountId: uuid('associate_account_id').notNull(),
    withdrawalTypeId: uuid('withdrawal_type_id'),
    withdrawalDate: timestamp('withdrawal_date').notNull().defaultNow(),
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    administrativeFee: numeric('administrative_fee', {
      precision: 20,
      scale: 6,
    }),
    disbursedAmount: numeric('disbursed_amount', { precision: 20, scale: 6 }),
    currencyCode: text('currency_code').notNull(),
    paymentMethod: text('payment_method'),
    referenceCode: varchar('reference_code', { length: 100 }),
    status: text('status').notNull(),
    commercialHouseId: uuid('commercial_house_id'),
    withdrawalItems: jsonb('withdrawal_items'),
  },
  (table) => [
    index('withdrawals_associate_account_idx').on(table.associateAccountId),
  ],
);

// --- loan_types --------------------------------------------------------------
export const loanTypes = savingsSchema.table('loan_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

// --- loans -------------------------------------------------------------------
export const loans = savingsSchema.table(
  'loans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    associateId: uuid('associate_id').notNull(),
    loanTypeId: uuid('loan_type_id').notNull(),
    requestDate: date('request_date').notNull(),
    approvalDate: date('approval_date'),
    disbursementDate: date('disbursement_date'),
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    approvedAmount: numeric('approved_amount', { precision: 20, scale: 6 }),
    disbursedAmount: numeric('disbursed_amount', { precision: 20, scale: 6 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    totalInterest: numeric('total_interest', { precision: 20, scale: 6 }),
    installmentAmount: numeric('Installment_amount', {
      precision: 20,
      scale: 6,
    }),
    totalPayable: numeric('total_payable', { precision: 20, scale: 6 }),
    expensesAmount: numeric('expenses_amount', { precision: 20, scale: 6 }),
    overdraftAmount: numeric('overdraft_amount', { precision: 20, scale: 6 }),
    previousLoanId: uuid('previous_loan_id'),
    paymentMethod: text('payment_method'),
    disbursementAccountId: uuid('disbursement_account_id'),
    status: text('status').notNull(),
    rejectionReason: text('rejection_reason'),
    notes: text('notes'),
    customReference: varchar('custom_reference', { length: 50 }),
    currencyCode: text('currency_code'),
    balanceInFavor: numeric('balance_in_favor', { precision: 20, scale: 6 }),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
    termType: varchar('term_type', { length: 20 }),
    termUnits: integer('term_units'),
  },
  (table) => [index('loans_associate_idx').on(table.associateId)],
);

// --- loan_amortization_schedule ---------------------------------------------
export const loanAmortizationSchedule = savingsSchema.table(
  'loan_amortization_schedule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    loanId: uuid('loan_id').notNull(),
    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    principalAmount: numeric('principal_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    interestAmount: numeric('interest_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    paymentStatus: text('payment_status').notNull(),
    paidAmount: numeric('paid_amount', { precision: 20, scale: 6 }),
    lastPaymentDate: timestamp('last_payment_date'),
  },
  (table) => [index('loan_amort_schedule_loan_idx').on(table.loanId)],
);

// --- loan_payments -----------------------------------------------------------
export const loanPayments = savingsSchema.table(
  'loan_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    loanId: uuid('loan_id').notNull(),
    paymentDate: timestamp('payment_date').notNull().defaultNow(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
    balancePending: numeric('balance_pending', {
      precision: 18,
      scale: 2,
    }).notNull(),
    status: text('payment_status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('loan_payments_loan_idx').on(table.loanId)],
);

// --- credits_types -----------------------------------------------------------
export const creditsTypes = savingsSchema.table('credits_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

// --- credits -----------------------------------------------------------------
export const credits = savingsSchema.table(
  'credits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    associateId: uuid('associate_id').notNull(),
    creditTypeId: uuid('credit_type_id').notNull(),
    requestDate: date('request_date').notNull(),
    approvalDate: date('approval_date'),
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    totalInterest: numeric('total_interest', { precision: 20, scale: 6 }),
    installmentAmount: numeric('Installment_amount', {
      precision: 20,
      scale: 6,
    }),
    totalPayable: numeric('total_payable', { precision: 20, scale: 6 }),
    expensesAmount: numeric('expenses_amount', { precision: 20, scale: 6 }),
    overdraftAmount: numeric('overdraft_amount', { precision: 20, scale: 6 }),
    previousCreditId: uuid('previous_credit_id'),
    status: text('status').notNull(),
    rejectionReason: text('rejection_reason'),
    notes: text('notes'),
    customReference: varchar('custom_reference', { length: 50 }),
    currencyCode: text('currency_code'),
    balanceInFavor: numeric('balance_in_favor', { precision: 20, scale: 6 }),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
    termType: varchar('term_type', { length: 20 }),
    termUnits: integer('term_units'),
    haberesPayment: numeric('haberes_payment', { precision: 20, scale: 6 }),
    directPayment: numeric('direct_payment', { precision: 20, scale: 6 }),
    directPaymentMethod: varchar('direct_payment_method', { length: 30 }),
    directPaymentReference: varchar('direct_payment_reference', {
      length: 100,
    }),
  },
  (table) => [index('credit_associate_idx').on(table.associateId)],
);

// --- credit_amortization_schedule -------------------------------------------
export const creditAmortizationSchedule = savingsSchema.table(
  'credit_amortization_schedule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creditId: uuid('credit_id').notNull(),
    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    principalAmount: numeric('principal_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    interestAmount: numeric('interest_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 20,
      scale: 6,
    }).notNull(),
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    paymentStatus: text('payment_status').notNull(),
    paidAmount: numeric('paid_amount', { precision: 20, scale: 6 }),
    lastPaymentDate: timestamp('last_payment_date'),
  },
  (table) => [index('credit_amort_schedule_credit_idx').on(table.creditId)],
);

// --- credit_payments ---------------------------------------------------------
export const creditPayments = savingsSchema.table(
  'credit_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    creditId: uuid('credit_id').notNull(),
    paymentDate: timestamp('payment_date').notNull().defaultNow(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
    balancePending: numeric('balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(),
    status: text('payment_status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('credit_payments_credit_idx').on(table.creditId)],
);

// --- credit_item_sales -------------------------------------------------------
export const creditItemSales = savingsSchema.table(
  'credit_item_sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    creditId: uuid('credit_id').notNull(),
    itemType: varchar('item_type', { length: 20 }).notNull(),
    itemId: uuid('item_id'),
    itemDescription: varchar('item_description', { length: 255 }),
    quantity: integer('quantity').notNull().default(1),
    agreedSellingPrice: numeric('agreed_selling_price', {
      precision: 20,
      scale: 6,
    }).notNull(),
    saleDate: date('sale_date').notNull(),
    deliveryStatus: varchar('delivery_status', { length: 50 }).notNull(),
    days: uuid('days'),
  },
  (table) => [index('credit_item_sale_credit_id_idx').on(table.creditId)],
);
