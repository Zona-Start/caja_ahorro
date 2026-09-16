import {
  boolean,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import { treasurySchema } from '../_schemas';
import {
  cashMovementReferenceTypeEnum,
  cashMovementTypeEnum,
  cashSessionStatusEnum,
  expenseNatureEnum,
  expensePaymentSourceEnum,
  expensePaymentStatusEnum,
  expenseReportStatusEnum,
  expenseStatusEnum,
  expenseTypeEnum,
  pettyCashReplenishmentStatusEnum,
  pettyCashSettlementStatusEnum,
  pettyCashVoucherStatusEnum,
  recurringFrequencyEnum,
} from '../enum/expenses.enum';
import { currencyCodeEnum } from '../enum/shared.enum';
import { accountPlan } from './accounting';
import { users } from './auth';
import { suppliers } from './purchasing';
import { tenants } from './tenants';
import { bankAccounts } from './treasury';

// Cajas registradoras / Puntos de Venta (POS)
export const cashRegisters = treasurySchema.table(
  'cash_registers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    registerTenantIdx: index('cash_registers_tenant_idx').on(table.tenantId),
  }),
);

// Sesiones de apertura/cierre de una caja registradora
export const cashRegisterSessions = treasurySchema.table(
  'cash_register_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cashRegisterId: uuid('cash_register_id')
      .references(() => cashRegisters.id, { onDelete: 'restrict' })
      .notNull(),
    openedByUserId: uuid('opened_by_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    closedByUserId: uuid('closed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: cashSessionStatusEnum('status').default('OPEN').notNull(),
    initialBalance: numeric('initial_balance', {
      precision: 18,
      scale: 4,
    }).notNull(),
    systemExpectedBalance: numeric('system_expected_balance', {
      precision: 18,
      scale: 4,
    }).default('0.0000'),
    actualPhysicalBalance: numeric('actual_physical_balance', {
      precision: 18,
      scale: 4,
    }),
    difference: numeric('difference', { precision: 18, scale: 4 }),
    openedAt: timestamp('opened_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
    ...timestamps,
  },
  (table) => ({
    registerIdx: index('cash_sessions_register_idx').on(table.cashRegisterId),
    sessionStatusIdx: index('cash_sessions_status_idx').on(table.status),
  }),
);

// Movimientos de efectivo dentro de una sesión de caja
export const cashMovements = treasurySchema.table(
  'cash_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => cashRegisterSessions.id, { onDelete: 'cascade' })
      .notNull(),
    type: cashMovementTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    concept: text('concept').notNull(),
    referenceType: cashMovementReferenceTypeEnum('reference_type'),
    referenceId: uuid('reference_id'),
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    movementSessionIdx: index('cash_movements_session_idx').on(table.sessionId),
    movementRefIdx: index('cash_movements_ref_idx').on(
      table.referenceType,
      table.referenceId,
    ),
  }),
);

// Centros de costos (para el modo corporativo)
export const costCenters = treasurySchema.table(
  'cost_centers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    monthlyBudget: numeric('monthly_budget', { precision: 18, scale: 4 }),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    costCenterTenantIdx: index('cost_centers_tenant_idx').on(table.tenantId),
    costCenterCodeUnique: index('cost_centers_code_uidx').on(
      table.tenantId,
      table.code,
    ),
  }),
);

// Categorías de gastos (vinculadas opcionalmente al Plan de Cuentas)
export const expenseCategories = treasurySchema.table(
  'expense_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    accountingAccountId: uuid('accounting_account_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    expenseCategoryTenantIdx: index('expense_categories_tenant_idx').on(
      table.tenantId,
    ),
  }),
);

// Tabla central de gastos (híbrida / polimórfica según la fuente del dinero)
export const expenses = treasurySchema.table(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, {
      onDelete: 'set null',
    }),
    costCenterId: uuid('cost_center_id').references(() => costCenters.id, {
      onDelete: 'set null',
    }),
    categoryId: uuid('category_id')
      .references(() => expenseCategories.id, { onDelete: 'restrict' })
      .notNull(),

    // FUENTE DE FINANCIAMIENTO (polimórfica según la arquitectura del negocio)
    paymentSource: expensePaymentSourceEnum('payment_source').notNull(),
    cashRegisterSessionId: uuid('cash_register_session_id').references(
      () => cashRegisterSessions.id,
      { onDelete: 'set null' },
    ),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id, {
      onDelete: 'set null',
    }),
    pettyCashFundId: uuid('petty_cash_fund_id').references(
      () => pettyCashFunds.id,
      { onDelete: 'set null' },
    ),

    type: expenseTypeEnum('type').default('EXPRESS').notNull(),
    paymentStatus: expensePaymentStatusEnum('payment_status')
      .default('PAID')
      .notNull(),
    // Flujo de aprobación: todo gasto nace PENDING_APPROVAL
    status: expenseStatusEnum('status').default('PENDING_APPROVAL').notNull(),
    // Naturaleza del gasto: fijo (programado/recurrente) o variable
    nature: expenseNatureEnum('nature').default('VARIABLE').notNull(),
    dueDate: timestamp('due_date'),
    frequency: recurringFrequencyEnum('frequency'),
    nextDueDate: timestamp('next_due_date'),
    recurringTemplateId: uuid('recurring_template_id'),
    expenseReportId: uuid('expense_report_id'),
    // Arqueo que cerró/concilió este gasto (Cerrado por Arqueo)
    pettyCashSettlementId: uuid('petty_cash_settlement_id'),

    amountBase: numeric('amount_base', { precision: 18, scale: 4 }).notNull(),
    taxAmountBase: numeric('tax_amount_base', {
      precision: 18,
      scale: 4,
    }).default('0.0000'),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    exchangeRate: numeric('exchange_rate', {
      precision: 14,
      scale: 6,
    }).notNull(),

    // Retenciones fiscales (modo corporativo)
    islrWithholdingAmount: numeric('islr_withholding_amount', {
      precision: 18,
      scale: 4,
    }).default('0.0000'),
    vatWithholdingAmount: numeric('vat_withholding_amount', {
      precision: 18,
      scale: 4,
    }).default('0.0000'),

    receiptNumber: varchar('receipt_number', { length: 100 }),
    receiptImageUrl: text('receipt_image_url'),
    description: text('description').notNull(),

    approvedByUserId: uuid('approved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectedByUserId: uuid('rejected_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),

    paidByUserId: uuid('paid_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    paidAt: timestamp('paid_at'),

    ...timestamps,
    deletedBy: uuid('deleted_by'),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    expenseTenantIdx: index('expenses_tenant_idx').on(table.tenantId),
    expenseSessionIdx: index('expenses_session_idx').on(
      table.cashRegisterSessionId,
    ),
    expenseBankIdx: index('expenses_bank_idx').on(table.bankAccountId),
    expensePettyCashIdx: index('expenses_petty_cash_idx').on(
      table.pettyCashFundId,
    ),
    expenseCategoryIdx: index('expenses_category_idx').on(table.categoryId),
    expenseCostCenterIdx: index('expenses_cost_center_idx').on(
      table.costCenterId,
    ),
  }),
);

// Fondo fijo / Caja chica administrativa
export const pettyCashFunds = treasurySchema.table(
  'petty_cash_funds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    custodianUserId: uuid('custodian_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    assignedAmount: numeric('assigned_amount', {
      precision: 18,
      scale: 4,
    }).notNull(),
    currentBalance: numeric('current_balance', {
      precision: 18,
      scale: 4,
    }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    pettyCashTenantIdx: index('petty_cash_tenant_idx').on(table.tenantId),
  }),
);

// Líneas de detalle de un gasto (varios conceptos por gasto)
export const expenseDetails = treasurySchema.table(
  'expense_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .references(() => expenses.id, { onDelete: 'cascade' })
      .notNull(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => expenseCategories.id, { onDelete: 'restrict' })
      .notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    taxRate: numeric('tax_rate', { precision: 6, scale: 2 })
      .default('0.00')
      .notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 4 })
      .default('0.0000')
      .notNull(),
    isExempt: boolean('is_exempt').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    expenseDetailExpenseIdx: index('expense_details_expense_idx').on(
      table.expenseId,
    ),
    expenseDetailCategoryIdx: index('expense_details_category_idx').on(
      table.categoryId,
    ),
  }),
);

// Vales de caja chica (entrega rápida de dinero; el gasto se reconoce al liquidar)
export const pettyCashVouchers = treasurySchema.table(
  'petty_cash_vouchers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    fundId: uuid('fund_id')
      .references(() => pettyCashFunds.id, { onDelete: 'cascade' })
      .notNull(),
    voucherNumber: varchar('voucher_number', { length: 30 }).notNull(),
    beneficiaryName: varchar('beneficiary_name', { length: 255 }).notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    concept: text('concept').notNull(),
    ticketImageUrl: text('ticket_image_url'),
    voucherDate: timestamp('voucher_date').defaultNow().notNull(),
    status: pettyCashVoucherStatusEnum('status').default('OPEN').notNull(),
    expenseId: uuid('expense_id'),
    // Arqueo que cerró/concilió este vale (Cerrado por Arqueo)
    settlementId: uuid('settlement_id'),
    liquidatedAt: timestamp('liquidated_at'),
    ...timestamps,
  },
  (table) => ({
    voucherFundIdx: index('petty_cash_vouchers_fund_idx').on(table.fundId),
    voucherStatusIdx: index('petty_cash_vouchers_status_idx').on(table.status),
  }),
);

// Arqueo / Rendición mensual de fondo fijo (cierre contable del mes)
export const pettyCashSettlements = treasurySchema.table(
  'petty_cash_settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    fundId: uuid('fund_id')
      .references(() => pettyCashFunds.id, { onDelete: 'cascade' })
      .notNull(),
    period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
    openingBalance: numeric('opening_balance', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    vouchersTotal: numeric('vouchers_total', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    expensesTotal: numeric('expenses_total', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    replenishmentsTotal: numeric('replenishments_total', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    physicalCount: numeric('physical_count', {
      precision: 18,
      scale: 4,
    }),
    difference: numeric('difference', { precision: 18, scale: 4 }),
    notes: text('notes'),
    status: pettyCashSettlementStatusEnum('status').default('OPEN').notNull(),
    closedByUserId: uuid('closed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    closedAt: timestamp('closed_at'),
    // Reposición de efectivo (reembolso al custodio) solicitada desde el arqueo
    replenishmentStatus: pettyCashReplenishmentStatusEnum(
      'replenishment_status',
    )
      .default('NONE')
      .notNull(),
    replenishmentAmount: numeric('replenishment_amount', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    replenishmentRequestedAt: timestamp('replenishment_requested_at'),
    replenishmentPaidAt: timestamp('replenishment_paid_at'),
    replenishmentPaidByUserId: uuid('replenishment_paid_by_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    ...timestamps,
  },
  (table) => ({
    settlementFundIdx: index('petty_cash_settlements_fund_idx').on(
      table.fundId,
    ),
    settlementPeriodIdx: index('petty_cash_settlements_period_idx').on(
      table.tenantId,
      table.period,
    ),
  }),
);

// Gastos recurrentes / automatizador (plantillas programadas)
export const recurringExpenseTemplates = treasurySchema.table(
  'recurring_expense_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id')
      .references(() => expenseCategories.id, { onDelete: 'restrict' })
      .notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, {
      onDelete: 'set null',
    }),
    costCenterId: uuid('cost_center_id').references(() => costCenters.id, {
      onDelete: 'set null',
    }),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    // Fuente de pago fija del gasto recurrente
    paymentSource: expensePaymentSourceEnum('payment_source')
      .default('BANK_ACCOUNT')
      .notNull(),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id, {
      onDelete: 'set null',
    }),
    pettyCashFundId: uuid('petty_cash_fund_id').references(
      () => pettyCashFunds.id,
      { onDelete: 'set null' },
    ),
    frequency: recurringFrequencyEnum('frequency').default('MONTHLY').notNull(),
    dayOfMonth: integer('day_of_month').default(1),
    nextRunDate: timestamp('next_run_date'),
    lastRunAt: timestamp('last_run_at'),
    autoCreate: boolean('auto_create').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    recurringTenantIdx: index('recurring_templates_tenant_idx').on(
      table.tenantId,
    ),
    recurringNextRunIdx: index('recurring_templates_next_run_idx').on(
      table.isActive,
      table.nextRunDate,
    ),
  }),
);

// Rendición de viáticos / reembolsos a empleados
export const expenseReports = treasurySchema.table(
  'expense_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    employeeUserId: uuid('employee_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    totalAmount: numeric('total_amount', {
      precision: 18,
      scale: 4,
    })
      .default('0.0000')
      .notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    status: expenseReportStatusEnum('status').default('PENDING').notNull(),
    // Fuente de pago al aprobar
    paymentSource: expensePaymentSourceEnum('payment_source'),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id, {
      onDelete: 'set null',
    }),
    pettyCashFundId: uuid('petty_cash_fund_id').references(
      () => pettyCashFunds.id,
      { onDelete: 'set null' },
    ),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectedByUserId: uuid('rejected_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    paidAt: timestamp('paid_at'),
    paidExpenseId: uuid('paid_expense_id'),
    ...timestamps,
  },
  (table) => ({
    reportTenantIdx: index('expense_reports_tenant_idx').on(table.tenantId),
    reportEmployeeIdx: index('expense_reports_employee_idx').on(
      table.employeeUserId,
    ),
    reportStatusIdx: index('expense_reports_status_idx').on(table.status),
  }),
);

// Items (tickets) de un reporte de reembolso
export const expenseReportItems = treasurySchema.table(
  'expense_report_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .references(() => expenseReports.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => expenseCategories.id, { onDelete: 'restrict' })
      .notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    receiptImageUrl: text('receipt_image_url'),
    expenseDate: timestamp('expense_date').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    reportItemReportIdx: index('expense_report_items_report_idx').on(
      table.reportId,
    ),
  }),
);
