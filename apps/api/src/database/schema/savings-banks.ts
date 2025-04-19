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
import { accountingEntries, accountPlan } from './accounting';
import { users } from './auth';
import { bankDirectory } from './banking';
import { categoryType, company, states } from './core';
import {
  associateMovementTypeEnum,
  currencyCodeEnum,
  genderEnum,
  loanStatusEnum,
  nationalityEnum,
  paymentStatusEnum,
  statusEnum,
} from './enum';
import { savingsBanksSchema } from './schemas';

// Tabla de los asociados. Almacena la información de los asociados de la caja de ahorro.
export const associates = savingsBanksSchema.table(
  'associates',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id') //id caja ahorro (compañia)
      .references(() => company.id, { onDelete: 'cascade' }),
    cedula: varchar('cedula', { length: 20 }).unique().notNull(), //cedula asociado
    fullname: varchar('fullname', { length: 255 }).notNull(), //nombre completo asosciado
    nationality: nationalityEnum('nationality').notNull(), // nacionalidad
    gender: genderEnum('gender'), // genero
    birthdate: date('birthdate'), //fecha de nacimiento
    dateAdmission: date('admission_date').notNull(), //fecha ingreso
    dateGraduation: date('graduation_date'), //fecha de egreso
    discountFrequencyId: integer('discount_frequency_id'), //fecha de descuento
    status: statusEnum('status').notNull().default('ACTIVE'), //estatus del asociado
    isPayrollCredit: boolean('is_payroll_credit').notNull().default(false), // posee credinomina
    localityId: integer('locality_id').references(() => states.id, {
      onDelete: 'set null',
    }), // id de la localidad
    phone: varchar('phone', { length: 50 }), // telefono
    email: varchar('email', { length: 100 }), // correo
    payrollTypeId: integer('payroll_type_id').references(
      () => categoryType.id,
      { onDelete: 'set null' },
    ), // tipo de nomina
    workerTypeId: integer('worker_type_id').references(() => categoryType.id, {
      onDelete: 'set null',
    }), // tipo de trabajador
    jobTitle: text('job_title'), // cargo del asosciado,
    baseSalary: numeric('base_salary', { precision: 15, scale: 2 }), //Salario base informativo
    ...timestamps,
  },
  (table) => ({
    cedulaSavingsBankIdx: uniqueIndex('associates_cedula_savings_bank_uidx').on(
      table.cedula,
      table.companyId,
    ),
    fullnameIdx: index('associates_fullname_idx').on(table.fullname),
    dateAdmissionIdx: index('associates_date_admission_idx').on(
      table.dateAdmission,
    ),
    dateGraduationIdx: index('associates_date_graduation_idx').on(
      table.dateGraduation,
    ),
    statusIdx: index('associates_status_idx').on(table.status),
    isPayrollCreditIdx: index('associates_is_payroll_credit_idx').on(
      table.isPayrollCredit,
    ),
    payrollTypeIdIdx: index('associates_payroll_type_idx').on(
      table.payrollTypeId,
    ),
    workerTypeIdIdx: index('associates_worker_type_idx').on(table.workerTypeId),
    localityIdIdx: index('associates_locality_idx').on(table.localityId),
  }),
);

//Tabla de Cuentas individuales de los asociados (ahorros, aportes).
export const associateAccounts = savingsBanksSchema.table(
  'associate_accounts',
  {
    id: serial('id').primaryKey(),
    associateId: integer('associated_id').references(() => associates.id, {
      onDelete: 'cascade',
    }), // id asosciado
    accountNumber: varchar('account_number', { length: 20 }).notNull().unique(), // numero de cuenta
    currencyCode: currencyCodeEnum('currency_code').notNull(), // Moneda de la cuenta (VES, USD)
    balance: numeric('balance', { precision: 18, scale: 2 })
      .default('0.00')
      .notNull(), // Saldo actual inicial (GUARDADO)
    openingDate: date('opening_date').defaultNow(), //fecha apertura
    bankDirectoryId: integer('bank_id').references(() => bankDirectory.id, {
      onDelete: 'set null',
    }), // id del banco
    salary: numeric('salary', { precision: 18, scale: 2 }), //salario base
    salaryTotal: numeric('salary_total', { precision: 18, scale: 2 }), //salario total
    status: statusEnum('status').notNull().default('ACTIVE'),
    ...timestamps,
  },
  (table) => ({
    accountNumberIdx: uniqueIndex('associate_accounts_account_number_uidx').on(
      table.accountNumber,
    ),
    associateIdx: index('associate_accounts_associate_idx').on(
      table.associateId,
    ),
    statusIdx: index('associate_accounts_status_idx').on(table.status),
    currencyIdx: index('associate_accounts_currency_idx').on(
      table.currencyCode,
    ),
    openingDateIdx: index('associate_opening_date_idx').on(table.openingDate),
  }),
);

//Historial de movimientos (créditos/débitos) en las cuentas de los asociados.
export const associateAccountMovements = savingsBanksSchema.table(
  'associate_account_movements',
  {
    id: serial('id').primaryKey(),
    associateAccountId: integer('associate_account_id')
      .notNull()
      .references(() => associateAccounts.id, { onDelete: 'cascade' }),
    movementType: associateMovementTypeEnum('movement_type').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // Monto siempre positivo
    movementSign: integer('movement_sign').notNull(), // Para calcular saldo fácilmente
    currencyCode: currencyCodeEnum('currency_code').notNull(), // Moneda de la transacción
    transactionDate: timestamp('transaction_date').notNull().defaultNow(), // Fecha y hora de la transacción
    description: text('description'),
    referenceId: text('reference_id'), // ID de la operación origen (ej: loan_id, withdrawal_request_id)
    referencType: varchar('reference_type', { length: 50 }), // Tipo de operación origen (ej: 'LOAN_PAYMENT', 'WITHDRAWAL')
    accountingEntryId: integer('accounting_entry_id').references(
      () => accountingEntries.id,
      { onDelete: 'set null' },
    ), // Enlace al asiento contable generado
    exchangeRateUsed: numeric('exchange_rate_used', {
      precision: 18,
      scale: 8,
    }), //campos para la conversión si la transacción fue en otra moneda
    amountBaseCurrency: numeric('amount_base_currency', {
      precision: 18,
      scale: 2,
    }), //campos para la conversión si la transacción fue en otra moneda
    ...timestamps,
  },
  (table) => ({
    accountDateIdx: index('assoc_acct_mov_account_date_idx').on(
      table.associateAccountId,
      table.transactionDate,
    ),
    typeIdx: index('assoc_acct_mov_type_idx').on(table.movementType),
    referenceIdx: index('assoc_acct_mov_reference_idx').on(
      table.referencType,
      table.referenceId,
    ),
    accountingEntryIdx: index('assoc_acct_mov_acct_entry_idx').on(
      table.accountingEntryId,
    ),
  }),
);

export const transactionType = savingsBanksSchema.table('transaction_type', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull(),
  description: text('description').notNull(),
  deferredDate: date('deferred_date').notNull(),
  dateCanceled: date('date_canceled').notNull(),
  deferredNumber: integer('deferred_number'),
  numberCanceled: integer('number_canceled'),
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

//Solicitudes y gestión de préstamos a asociados.
export const loans = savingsBanksSchema.table(
  'loans',
  {
    id: serial('id').primaryKey(),
    associateId: integer('associate_id')
      .notNull()
      .references(() => associates.id, { onDelete: 'restrict' }),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    loanTypeId: integer('loan_type_id'), // FK a CategoryType con group='LOAN_TYPE' o tabla específica loan_types
    requestDate: date('request_date').notNull().defaultNow(),
    requestedAmount: numeric('requested_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    approvedAmount: numeric('approved_amount', { precision: 18, scale: 2 }),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    interestRate_annual: numeric('interest_rate_annual', {
      precision: 5,
      scale: 2,
    }).notNull(), //Tasa de interés nominal anual (%)
    termMonths: integer('term_months').notNull(),
    installmentsCount: integer('installments_count').notNull(), // Número de cuotas
    status: loanStatusEnum('status').notNull().default('REQUESTED'),
    approvalDate: date('approval_date'),
    approvedByUserId: integer('approved_by_user_id').references(() => users.id),
    disbursementDate: date('disbursement_date'),
    disbursedByUserId: integer('disbursed_by_user_id').references(
      () => users.id,
    ),
    disbursementAccountId: integer('disbursement_account_id').references(
      () => associateAccounts.id,
    ), //Cuenta del asociado donde se desembolsó
    disbursementAccountingEntryId: integer(
      'disbursement_accounting_entry_id',
    ).references(() => accountingEntries.id), // Asiento del desembolso
    purpose: text('purpose'), // Motivo del préstamo
    rejectionReason: text('rejection_reason'),
    // Campos calculados (podrían estar o calcularse):
    // total_interest: numeric('total_interest', { precision: 18, scale: 2 }),
    // total_payable: numeric('total_payable', { precision: 18, scale: 2 }),
    ...timestamps,
  },
  (table) => ({
    associateIdx: index('loans_associate_idx').on(table.associateId),
    statusDateIdx: index('loans_status_date_idx').on(
      table.status,
      table.requestDate,
    ),
    currencyIdx: index('loans_currency_idx').on(table.currencyCode),
  }),
);

//Tabla de amortización detallada para cada préstamo.
export const loanAmortizationSchedule = savingsBanksSchema.table(
  'loan_amortization_schedule',
  {
    id: serial('id').primaryKey(),
    loan_id: integer('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    principalAmount: numeric('principal_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    interestAmount: numeric('interest_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 18,
      scale: 2,
    }).notNull(), //Saldo de capital después de esta cuota
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'),
    paidAmount: numeric('paid_amount', { precision: 18, scale: 2 }).default(
      '0.00',
    ),
    lastPaymentDate: timestamp('last_payment_date'),
    // payment_reference_id: integer('payment_reference_id'), // Podría ser FK a una tabla de pagos si es compleja
    paymentAccountingEntryId: integer('payment_accounting_entry_id').references(
      () => accountingEntries.id,
    ), // Asiento del pago (o asiento de provisión de interés)
    ...timestamps,
  },
  (table) => ({
    loanInstallmentIdx: uniqueIndex('loan_amort_loan_installment_uidx').on(
      table.loan_id,
      table.installmentNumber,
    ), // Cuota única por préstamo
    dueDateStatusIdx: index('loan_amort_due_date_status_idx').on(
      table.dueDate,
      table.paymentStatus,
    ),
  }),
);
