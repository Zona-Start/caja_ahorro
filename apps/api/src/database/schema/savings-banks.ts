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
import { categoryType, company, states, typePayrolls } from './core';
import {
  associateMovementTypeEnum,
  currencyCodeEnum,
  genderEnum,
  loanStatusEnum,
  nationalityEnum,
  paymentMethodEnum,
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
    discountFrequencyId: integer('discount_frequency_id'), //fecuencia de descuento
    status: statusEnum('status').notNull().default('ACTIVE'), //estatus del asociado
    isPayrollCredit: boolean('is_payroll_credit').notNull().default(false), // posee credinomina
    localityId: integer('locality_id').references(() => states.id, {
      onDelete: 'set null',
    }), // id de la localidad
    phone: varchar('phone', { length: 50 }), // telefono
    email: varchar('email', { length: 100 }), // correo
    payrollTypeId: integer('payroll_type_id').references(
      () => typePayrolls.id,
      { onDelete: 'set null' },
    ), // tipo de nomina
    associatedTypeId: integer('associated_type_id').references(
      () => categoryType.id,
      {
        onDelete: 'set null',
      },
    ), // tipo de trabajador
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
    associatedTypeIdIdx: index('associates_type_idx').on(
      table.associatedTypeId,
    ),
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
    closingDate: date('closing_date'), // Fecha de cierre de la cuenta (si aplica)
    bankDirectoryId: integer('bank_id').references(() => bankDirectory.id, {
      onDelete: 'set null',
    }), // id del banco
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
    closingDateIdx: index('associate_accounts_closing_date_idx').on(
      table.closingDate,
    ),
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

export const loanTypes = savingsBanksSchema.table(
  'loan_types',
  {
    id: serial('id').primaryKey(), // ID único del tipo de préstamo
    name: varchar('name', { length: 100 }).notNull(), // Nombre del tipo de préstamo
    description: text('description'), // Descripción del tipo de préstamo
    interestRate: numeric('interest_rate', {
      precision: 5,
      scale: 2,
    }).notNull(), // Tasa de interés (puede ser mensual o anual, especificar en la descripción)
    termType: varchar('term_type', { length: 20 }).notNull(), // Tipo de plazo: "CUOTAS" o "PLAZO" (para indicar si se maneja por número de cuotas o un plazo fijo)
    termUnits: integer('term_units').notNull(), // Número de cuotas o duración del plazo (en meses, días, etc., según se especifique)
    cancellationPercentage: numeric('cancellation_percentage', {
      precision: 5,
      scale: 2,
    }), // Porcentaje de cancelación anticipada (si aplica)
    loanAccountChartId: integer('loan_account_chart_id')
      .references(() => accountPlan.id, { onDelete: 'set null' })
      .notNull(), // Cuenta contable para los préstamos otorgados
    interestEarnedAccountChartId: integer('interest_earned_account_chart_id')
      .references(() => accountPlan.id, { onDelete: 'set null' })
      .notNull(), // Cuenta contable para los intereses ganados
    specialQuotaAccountChartId: integer(
      'special_quota_account_chart_id',
    ).references(() => accountPlan.id, { onDelete: 'set null' }), // Cuenta contable para las cuotas especiales (opcional)
    expenseAccountChartId: integer('expense_account_chart_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ), // Cuenta contable para los gastos asociados al préstamo (opcional)
    specialQuotaNumber: integer('special_quota_number').default(0), // Número de cuotas especiales permitidas
    specialQuotaPercentage: numeric('special_quota_percentage', {
      precision: 5,
      scale: 2,
    }).default('0'), // Porcentaje de las cuotas especiales
    maxLoanAmount: numeric('max_loan_amount', { precision: 18, scale: 2 }), // Monto máximo permitido para el préstamo
    minLoanAmount: numeric('min_loan_amount', { precision: 18, scale: 2 }), // Monto mínimo permitido para el préstamo
    payrollTypeId: integer('payroll_type_id').references(
      () => categoryType.id,
      {
        onDelete: 'set null',
      },
    ), // Relación con el tipo de nómina (opcional)
    administrativeExpensePercentage: numeric(
      'administrative_expense_percentage',
      {
        precision: 5,
        scale: 2,
      },
    ).default('0'), // Porcentaje de gastos administrativos
    minimumSeniorityMonths: integer('minimum_seniority_months').default(0), // Antigüedad mínima requerida en la caja de ahorro (en meses)
    acceptsDebitBalance: boolean('accepts_debit_balance')
      .notNull()
      .default(false), // ¿Acepta saldo deudor?
    acceptsGuarantors: boolean('accepts_guarantors').notNull().default(false), // ¿Acepta fiadores?
    acceptsAvailability: boolean('accepts_availability')
      .notNull()
      .default(false), // ¿Acepta usar la disponibilidad como garantía?
    acceptsRefinancing: boolean('accepts_refinancing').notNull().default(false), // ¿Acepta refinanciamiento de préstamo?
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    nameIdx: index('loan_types_name_idx').on(table.name), // Índice para búsqueda por nombre del tipo de préstamo
    loanAccountChartIdIdx: index('loan_types_loan_account_chart_id_idx').on(
      table.loanAccountChartId,
    ),
    interestEarnedAccountChartIdIdx: index(
      'loan_types_interest_earned_account_chart_id_idx',
    ).on(table.interestEarnedAccountChartId),
    specialQuotaAccountChartIdIdx: index(
      'loan_types_special_quota_account_chart_id_idx',
    ).on(table.specialQuotaAccountChartId),
    expenseAccountChartIdIdx: index(
      'loan_types_expense_account_chart_id_idx',
    ).on(table.expenseAccountChartId),
    payrollTypeIdIdx: index('loan_types_payroll_type_id_idx').on(
      table.payrollTypeId,
    ),
  }),
);

//Solicitudes y gestión de préstamos a asociados.
export const loans = savingsBanksSchema.table(
  'loans',
  {
    id: serial('id').primaryKey(), // ID único del préstamo
    associateId: integer('associate_id')
      .notNull()
      .references(() => associates.id, { onDelete: 'restrict' }), // FK al asociado
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }), // FK a la empresa o cooperativa
    loanTypeId: integer('loan_type_id') // Tipo de préstamo (FK a tabla de tipos)
      .notNull()
      .references(() => loanTypes.id),
    requestDate: date('request_date').notNull().defaultNow(), // Fecha en que se solicita
    approvalDate: date('approval_date'), // Fecha de aprobación (si aplica)
    disbursementDate: date('disbursement_date'), // Fecha del desembolso
    requestedAmount: numeric('requested_amount', {
      precision: 18,
      scale: 2,
    }).notNull(), // Monto solicitado
    approvedAmount: numeric('approved_amount', { precision: 18, scale: 2 }), // Monto aprobado
    disbursedAmount: numeric('disbursed_amount', { precision: 18, scale: 2 }), // Monto efectivamente desembolsado
    interestRate_annual: numeric('interest_rate_annual', {
      precision: 5,
      scale: 2,
    }).notNull(), // % interés anual
    termMonths: integer('term_months').notNull(), // Duración en meses
    installmentsCount: integer('installments_count').notNull(), // Número de cuotas
    projectedInstallmentAmount: numeric('projected_installment_amount', {
      precision: 18,
      scale: 2,
    }), // Cuota estimada
    startDate: date('start_date'), // Fecha de inicio de pago
    endDate: date('end_date'), // Fecha final del préstamo
    totalInterest: numeric('total_interest', { precision: 18, scale: 2 }), // Intereses totales
    totalPayable: numeric('total_payable', { precision: 18, scale: 2 }), // Total a pagar
    expensesAmount: numeric('expenses_amount', { precision: 18, scale: 2 }), // Monto de gastos administrativos
    overdraftAmount: numeric('overdraft_amount', { precision: 18, scale: 2 }), // Sobregiro si aplica
    previousLoanId: integer('previous_loan_id').references(() => loans.id), // Relación con préstamo anterior si existe
    paymentMethod: paymentMethodEnum('payment_method'), // Forma de pago (transferencia, cheque, efectivo)
    disbursementAccountId: integer('disbursement_account_id') // Cuenta del asociado donde se desembolsa
      .references(() => associateAccounts.id),
    status: loanStatusEnum('status').notNull().default('REQUESTED'), // Estado actual del préstamo
    rejectionReason: text('rejection_reason'), // En caso de rechazo
    approvedByUserId: integer('approved_by_user_id').references(() => users.id), // Usuario que aprueba
    disbursedByUserId: integer('disbursed_by_user_id').references(
      () => users.id,
    ), // Usuario que desembolsa
    notes: text('notes'), // Observaciones
    customReference: varchar('custom_reference', { length: 50 }), // Nro. solicitud personalizado
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    associateIdx: index('loans_associate_idx').on(table.associateId),
    statusDateIdx: index('loans_status_date_idx').on(
      table.status,
      table.requestDate,
    ),
  }),
);

// Tabla de amortización del préstamo
export const loanAmortizationSchedule = savingsBanksSchema.table(
  'loan_amortization_schedule',
  {
    id: serial('id').primaryKey(),
    loanId: integer('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }), // FK al préstamo
    installmentNumber: integer('installment_number').notNull(), // Número de cuota (1, 2, 3, ...)
    dueDate: date('due_date').notNull(), // Fecha en que debe pagarse esta cuota
    principalAmount: numeric('principal_amount', {
      precision: 18,
      scale: 2,
    }).notNull(), // Monto del capital de esta cuota
    interestAmount: numeric('interest_amount', {
      precision: 18,
      scale: 2,
    }).notNull(), // Monto del interés de esta cuota
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 18,
      scale: 2,
    }).notNull(), // Total a pagar en esta cuota
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 18,
      scale: 2,
    }).notNull(), // Saldo de capital pendiente después de esta cuota
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'), // Estado de la cuota (PENDING, PAID, LATE, etc.)
    paidAmount: numeric('paid_amount', { precision: 18, scale: 2 }).default(
      '0.00',
    ), // Monto total pagado hasta ahora para esta cuota
    lastPaymentDate: timestamp('last_payment_date'), // Última fecha en que se realizó un pago para esta cuota
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    loanInstallmentIdx: uniqueIndex('loan_amort_loan_installment_uidx').on(
      table.loanId,
      table.installmentNumber,
    ), // Cada cuota debe ser única por préstamo
    dueDateStatusIdx: index('loan_amort_due_date_status_idx').on(
      table.dueDate,
      table.paymentStatus,
    ), // Para consultas rápidas por vencimiento y estado
  }),
);

// Tabla para registrar cambios de estado del préstamo
export const loanStatusHistory = savingsBanksSchema.table(
  'loan_status_history',
  {
    id: serial('id').primaryKey(),
    loanId: integer('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }), // Relación al préstamo correspondiente
    status: loanStatusEnum('status').notNull(), // Nuevo estado aplicado al préstamo
    changedAt: timestamp('changed_at').notNull().defaultNow(), // Fecha y hora del cambio de estado
    changedByUserId: integer('changed_by_user_id').references(() => users.id), // Usuario que realizó el cambio
    comment: text('comment'), // Comentario u observación sobre el cambio
  },
);

// tabla registro de los pagos
export const loanPayments = savingsBanksSchema.table('loan_payments', {
  id: serial('id').primaryKey(),
  loanId: integer('loan_id')
    .notNull()
    .references(() => loans.id, { onDelete: 'cascade' }),
  installmentId: integer('installment_id').references(
    () => loanAmortizationSchedule.id,
    { onDelete: 'cascade' },
  ), // Si aplica a una cuota específica
  paymentDate: timestamp('payment_date').notNull().defaultNow(), // fecha del pago
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // Monto pagado
  bankId: integer('bank_id')
    .notNull()
    .references(() => bankDirectory.id), // Banco que procesó el pago
  paymentMethod: paymentMethodEnum('payment_method').notNull(), // Ej: 'transferencia', 'depósito', 'efectivo'
  transactionReference: text('transaction_reference'), // Número de comprobante, referencia bancaria, etc.
  comment: text('comment'),
  ...timestamps,
});
