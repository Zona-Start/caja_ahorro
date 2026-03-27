import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import {
  associateMovementTypeEnum,
  creditModalityTypeEnum,
  creditPaymentTypeEnum,
  creditStatusEnum,
  currencyCodeEnum,
  genderEnum,
  liquidationsStatusEnum,
  loanModalityTypeEnum,
  loanPaymentTypeEnum,
  loanStatusEnum,
  movementStatusEnum,
  nationalityEnum,
  paymentBatchItemType,
  paymentBatchStatus,
  paymentMethodEnum,
  paymentStatus,
  paymentStatusEnum,
  statusEnum,
  withdrawalStatusEnum,
} from '../enum/enum';
import { savingsBanksSchema } from '../schemas';
import { accountPlan } from './accounting';
import { suppliers } from './administration';
import { users } from './auth';
import { bankDirectory, bankTransactions } from './banking';
import {
  categoryType,
  company,
  exchangeRates,
  states,
  typePayrolls,
} from './core';

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
    baseSalary: numeric('base_salary', { precision: 20, scale: 6 }), //Salario base informativo
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
    balance: numeric('balance', { precision: 20, scale: 6 })
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

export const associateAccountMovements = savingsBanksSchema.table(
  'associate_account_movements',
  {
    id: serial('id').primaryKey(),
    associateAccountId: integer('associate_account_id')
      .notNull()
      .references(() => associateAccounts.id, { onDelete: 'cascade' }),
    movementType: associateMovementTypeEnum('movement_type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // Monto siempre positivo
    currencyCode: currencyCodeEnum('currency_code').notNull(), // Moneda de la transacción
    transactionDate: timestamp('transaction_date').notNull().defaultNow(), // Fecha y hora de la transacción
    description: text('description'),
    referenceId: text('reference_id'), // ID de la operación origen
    referenceType: varchar('reference_type', { length: 50 }), // Tipo de operación origen (tabla de donde es la referencia id)
    referenceNumber: varchar('reference_number', { length: 20 }),
    exchangeRateId: integer('exchange_rate_id').references(
      () => exchangeRates.id,
      { onDelete: 'set null' }, // O 'restrict' según tus necesidades
    ),
    status: movementStatusEnum('status').notNull().default('PENDING'),
    ...timestamps,
  },
  (table) => ({
    accountDateIdx: index('assoc_acct_mov_account_date_idx').on(
      table.associateAccountId,
      table.transactionDate,
    ),
    typeIdx: index('assoc_acct_mov_type_idx').on(table.movementType),
    referenceIdx: index('assoc_acct_mov_reference_idx').on(
      table.referenceType,
      table.referenceId,
    ),
    // Índice para el nuevo campo de tasa de cambio (opcional pero recomendado)
    exchangeRateIdx: index('assoc_acct_mov_exchange_rate_idx').on(
      table.exchangeRateId,
    ),
  }),
);

// historial de saldo
export const associateAccountBalanceHistory = savingsBanksSchema.table(
  'associate_account_balance_history',
  {
    id: serial('id').primaryKey(),
    associateAccountId: integer('associate_account_id')
      .notNull()
      .references(() => associateAccounts.id, { onDelete: 'cascade' }),
    balanceDate: timestamp('balance_date').notNull().defaultNow(), // Fecha y hora del saldo
    balance: numeric('balance', { precision: 20, scale: 6 }).notNull(), // Saldo en ese momento
    movementId: integer('movement_id').references(
      () => associateAccountMovements.id,
      { onDelete: 'set null' },
    ), // ID del movimiento que causó este saldo
    reason: varchar('reason', { length: 255 }), // Razón del cambio de saldo (ej: 'Nuevo movimiento', 'Corrección de saldo')
    ...timestamps,
  },
  (table) => ({
    accountDateIdx: index('assoc_acct_bal_hist_account_date_idx').on(
      table.associateAccountId,
      table.balanceDate,
    ),
    movementIdx: index('assoc_acct_bal_hist_movement_idx').on(table.movementId),
  }),
);

//tipos de tipos  retiros
export const withdrawalTypes = savingsBanksSchema.table(
  'withdrawal_types',
  {
    id: serial('id').primaryKey(),
    description: varchar('description', { length: 255 }).notNull().unique(), // Descripción del tipo de retiro (ej: 'Retiro regular', 'Retiro por emergencia')
    withdrawalPercentage: numeric('withdrawal_percentage', {
      precision: 5,
      scale: 2,
    }), // Porcentaje máximo del saldo que se puede retirar (si aplica)
    accountDebit: integer('account_debit').references(() => accountPlan.id, {
      onDelete: 'set null',
    }), // Cuenta contable para el débito del retiro
    expenseAccount: integer('expense_account').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ), // Cuenta contable para el gasto administrativo (si aplica)
    administrativeFeePercentage: numeric('administrative_fee_percentage', {
      precision: 5,
      scale: 2,
    }).default('0.00'), // Porcentaje del retiro para el gasto administrativo (si aplica)
    withdrawalLimitQuantity: integer('withdrawal_limit_quantity'), // Cantidad máxima de retiros permitidos (ej: por mes, si aplica)
    minimumAntiquityDays: integer('minimum_antiquity_days'), // Antigüedad mínima requerida del asociado para este tipo de retiro (en días, si aplica)
    withdrawalFrequencyRelation: integer('category_id').references(
      () => categoryType.id, // Relación con una tabla de categorías (ej: categorías de asociados para diferentes frecuencias de retiro)
      { onDelete: 'set null' },
    ),
    isHouseComercial: boolean('is_house_comercial').notNull().default(false), //
    isInternalInventory: boolean('is_internal_inventory')
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => ({
    descriptionIdx: uniqueIndex('withdrawal_types_description_uidx').on(
      table.description,
    ), // Índice único para la descripción
    accountDebitIdx: index('withdrawal_types_account_debit_idx').on(
      table.accountDebit,
    ), // Índice para la cuenta de débito
    expenseAccountIdx: index('withdrawal_types_expense_account_idx').on(
      table.expenseAccount,
    ), // Índice para la cuenta de gasto
    withdrawalFrequencyRelationIdx: index(
      'withdrawal_types_frequency_relation_idx',
    ).on(table.withdrawalFrequencyRelation), // Índice para la relación de frecuencia
  }),
);

//tabla de retiros
export const withdrawalsAssociates = savingsBanksSchema.table(
  'withdrawals_associates',
  {
    id: serial('id').primaryKey(),
    associateAccountId: integer('associate_account_id')
      .notNull()
      .references(() => associateAccounts.id, { onDelete: 'cascade' }),
    withdrawalTypeId: integer('withdrawal_type_id').references(
      () => withdrawalTypes.id, // Referencia a la tabla de tipos de retiro
      { onDelete: 'set null' },
    ),
    withdrawalDate: timestamp('withdrawal_date').notNull().defaultNow(),
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto bruto solicitado por el asociado
    administrativeFee: numeric('administrative_fee', {
      precision: 20,
      scale: 6,
    }).default('0.00'),
    disbursedAmount: numeric('disbursed_amount', { precision: 20, scale: 6 }), // Monto neto desembolsado (requestedAmount - administrativeFee)
    paymentMethod: paymentMethodEnum('payment_method'), // Ej: 'Transferencia', 'Cheque', 'Efectivo'
    referenceCode: varchar('reference_code', { length: 100 }).unique(), // Código de referencia único generado por el backend
    status: withdrawalStatusEnum('status').default('REQUESTED').notNull(),
    bankTransactionId: integer('bank_transaction_id').references(
      () => bankTransactions.id,
    ),
    commercialHouseId: integer('commercial_house_id').references(
      () => suppliers.id,
      { onDelete: 'set null' },
    ),
    withdrawalItems: jsonb('withdrawal_items'),
    ...timestamps,
  },
  (table) => ({
    associateAccountIdx: index('withdrawals_associate_account_idx').on(
      table.associateAccountId,
    ), // Índice para buscar retiros por asociado
    withdrawalTypeIdx: index('withdrawals_withdrawal_type_idx').on(
      table.withdrawalTypeId,
    ), // Índice para buscar retiros por tipo
    withdrawalDateIdx: index('withdrawals_withdrawal_date_idx').on(
      table.withdrawalDate,
    ), // Índice para buscar retiros por fecha
    referenceCodeIdx: uniqueIndex('withdrawals_reference_code_uidx').on(
      table.referenceCode,
    ), // Índice único para el código de referencia
  }),
);

// tipos de prestamos
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
    loanAccountChartId: integer('loan_account_chart_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ), // Cuenta contable para los préstamos otorgados
    interestEarnedAccountChartId: integer(
      'interest_earned_account_chart_id',
    ).references(() => accountPlan.id, { onDelete: 'set null' }), // Cuenta contable para los intereses ganados
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
    maxLoanAmount: numeric('max_loan_amount', { precision: 20, scale: 6 }), // Monto máximo permitido para el préstamo
    minLoanAmount: numeric('min_loan_amount', { precision: 20, scale: 6 }), // Monto mínimo permitido para el préstamo
    payrollTypeId: integer('payroll_type_id').references(
      () => typePayrolls.id,
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
    loanModality: loanModalityTypeEnum('loan_modality').notNull(), // Modalidad del préstamo (Ej: ordinario, cuotas especiales)
    requestDate: date('request_date').notNull().defaultNow(), // Fecha en que se solicita
    approvalDate: date('approval_date'), // Fecha de aprobación (si aplica)
    disbursementDate: date('disbursement_date'), // Fecha del desembolso
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto solicitado
    approvedAmount: numeric('approved_amount', { precision: 20, scale: 6 }), // Monto aprobado
    disbursedAmount: numeric('disbursed_amount', { precision: 20, scale: 6 }), // Monto efectivamente desembolsado
    startDate: date('start_date'), // Fecha de inicio de pago
    endDate: date('end_date'), // Fecha final del préstamo
    totalInterest: numeric('total_interest', { precision: 20, scale: 6 }), // Intereses totales
    installmentAmount: numeric('Installment_amount', {
      precision: 20,
      scale: 6,
    }), // monto de la cuota
    totalPayable: numeric('total_payable', { precision: 20, scale: 6 }), // Total a pagar
    expensesAmount: numeric('expenses_amount', { precision: 20, scale: 6 }), // Monto de gastos administrativos
    overdraftAmount: numeric('overdraft_amount', { precision: 20, scale: 6 }), // Sobregiro si aplica
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
    currencyCode: currencyCodeEnum('currency_code'), // Moneda del préstamo (VES, USD)
    exchangeRateId: integer('exchange_rate_id').references(
      () => exchangeRates.id,
      { onDelete: 'set null' }, // O 'restrict' según tus necesidades
    ),
    balanceInFavor: numeric('balance_in_favor', { precision: 20, scale: 6 }), // balance a favor si aplica
    interestRate: numeric('interest_rate', {
      precision: 5,
      scale: 2,
    }), // Tasa de interés
    termType: varchar('term_type', { length: 20 }), // Tipo de plazo: "CUOTAS" o "PLAZO" (para indicar si se maneja por número de cuotas o un plazo fijo)
    termUnits: integer('term_units'), // Número de cuotas o duración del plazo)
    expensesPercentage: numeric('expenses_percentage', {
      precision: 5,
      scale: 2,
    }), // % de gastos administrativos personalizado (null = usa el del tipo de préstamo)
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
      precision: 20,
      scale: 6,
    }).notNull(), // Monto del capital de esta cuota
    interestAmount: numeric('interest_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto del interés de esta cuota
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Total a pagar en esta cuota
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(), // Saldo de capital pendiente después de esta cuota
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'), // Estado de la cuota (PENDING, PAID, LATE, etc.)
    paidAmount: numeric('paid_amount', { precision: 20, scale: 6 }).default(
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
  (table) => ({
    loanStatusHistoryIdx: index('loan_status_history_idx').on(table.status),
  }),
);

// tabla registro de los pagos
export const loanPayments = savingsBanksSchema.table(
  'loan_payments',
  {
    id: serial('id').primaryKey(),
    loanId: integer('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    paymentDate: timestamp('payment_date').notNull().defaultNow(), // fecha del pago
    paymentType: loanPaymentTypeEnum('payment-type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // Monto pagado
    balancePending: numeric('balance_pending', {
      precision: 18,
      scale: 2,
    }).notNull(), //saldo pendiente luego del pago
    bankId: integer('bank_id').references(() => bankDirectory.id), // Banco que procesó el pago
    paymentMethod: paymentMethodEnum('payment_method').notNull(), // Ej: 'transferencia', 'depósito', 'efectivo'
    transactionReference: text('transaction_reference'), // Número de comprobante, referencia bancaria, etc.
    status: paymentStatus('payment_status').default('DONE').notNull(),
    comment: text('comment'),
    customReference: varchar('custom_reference', { length: 50 }), // Nro. solicitud personalizado
    ...timestamps,
  },
  (table) => ({
    loanPaymentsReferenceIdx: uniqueIndex('loan_payments_uidx').on(
      table.customReference,
    ),
    paymentDateIdx: index('loan_payments_date_idx').on(table.paymentDate),
    customReferenceIdx: index('loan_payments_reference_idx').on(
      table.customReference,
    ),
    transactionReferenceIdx: index(
      'loan_payments_transaction_reference_idx',
    ).on(table.transactionReference),
  }),
);

// tabla registro de los pagos
export const loanPaymentsDetails = savingsBanksSchema.table(
  'loan_payment_details',
  {
    id: serial('id').primaryKey(),
    loanPaymentId: integer('loan_payment_id')
      .notNull()
      .references(() => loanPayments.id, { onDelete: 'cascade' }),
    installmentId: integer('installment_id').references(
      () => loanAmortizationSchedule.id,
      { onDelete: 'cascade' },
    ), // Si aplica a una cuota específica
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // Monto pagado
    status: paymentStatus('payment_status').default('DONE').notNull(),
    ...timestamps,
  },
  (table) => ({
    installmentIdx: index('loan_payments_details_installment_idx').on(
      table.installmentId,
    ),
  }),
);

// tipos de creditos
export const creditsTypes = savingsBanksSchema.table(
  'credits_types',
  {
    id: serial('id').primaryKey(), // ID único del tipo de credito
    name: varchar('name', { length: 100 }).notNull(), // Nombre del tipo de credito
    description: text('description'), // Descripción del tipo de credito
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
    creditAccountChartId: integer('credit_account_chart_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ), // Cuenta contable para los credito otorgados
    interestEarnedAccountChartId: integer(
      'interest_earned_account_chart_id',
    ).references(() => accountPlan.id, { onDelete: 'set null' }), // Cuenta contable para los intereses ganados
    specialQuotaAccountChartId: integer(
      'special_quota_account_chart_id',
    ).references(() => accountPlan.id, { onDelete: 'set null' }), // Cuenta contable para las cuotas especiales (opcional)
    expenseAccountChartId: integer('expense_account_chart_id').references(
      () => accountPlan.id,
      { onDelete: 'set null' },
    ), // Cuenta contable para los gastos asociados al credito (opcional)
    specialQuotaNumber: integer('special_quota_number').default(0), // Número de cuotas especiales permitidas
    specialQuotaPercentage: numeric('special_quota_percentage', {
      precision: 5,
      scale: 2,
    }).default('0'), // Porcentaje de las cuotas especiales
    maxCreditAmount: numeric('max_credit_amount', { precision: 20, scale: 6 }), // Monto máximo permitido para el credito
    minCreditAmount: numeric('min_credit_amount', { precision: 20, scale: 6 }), // Monto mínimo permitido para el credito
    payrollTypeId: integer('payroll_type_id').references(
      () => typePayrolls.id,
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
    acceptsRefinancing: boolean('accepts_refinancing').notNull().default(false), // ¿Acepta refinanciamiento de credito?
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    nameIdx: index('credits_types_name_idx').on(table.name), // Índice para búsqueda por nombre del tipo de credito
    creditAccountChartIdIdx: index(
      'credits_types_credit_account_chart_id_idx',
    ).on(table.creditAccountChartId),
    interestEarnedAccountChartIdIdx: index(
      'credits_types_interest_earned_account_chart_id_idx',
    ).on(table.interestEarnedAccountChartId),
    specialQuotaAccountChartIdIdx: index(
      'credits_types_special_quota_account_chart_id_idx',
    ).on(table.specialQuotaAccountChartId),
    expenseAccountChartIdIdx: index(
      'credits_types_expense_account_chart_id_idx',
    ).on(table.expenseAccountChartId),
    payrollTypeIdIdx: index('credits_types_payroll_type_id_idx').on(
      table.payrollTypeId,
    ),
  }),
);

//Solicitudes y gestión de creditos a asociados.
export const credits = savingsBanksSchema.table(
  'credits',
  {
    id: serial('id').primaryKey(), // ID único del préstamo
    associateId: integer('associate_id')
      .notNull()
      .references(() => associates.id, { onDelete: 'restrict' }), // FK al asociado
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }), // FK a la empresa o cooperativa
    creditTypeId: integer('credit_type_id') // Tipo de credito (FK a tabla de tipos)
      .notNull()
      .references(() => creditsTypes.id),
    creditModality: creditModalityTypeEnum('credit_modality').notNull(), // Modalidad del credito (Ej: ordinario, cuotas especiales)
    requestDate: date('request_date').notNull().defaultNow(), // Fecha en que se solicita
    approvalDate: date('approval_date'), // Fecha de aprobación (si aplica)
    requestedAmount: numeric('requested_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto solicitado
    startDate: date('start_date'), // Fecha de inicio de pago
    endDate: date('end_date'), // Fecha final del préstamo
    totalInterest: numeric('total_interest', { precision: 20, scale: 6 }), // Intereses totales
    installmentAmount: numeric('Installment_amount', {
      precision: 20,
      scale: 6,
    }), // monto de la cuota
    totalPayable: numeric('total_payable', { precision: 20, scale: 6 }), // Total a pagar
    expensesAmount: numeric('expenses_amount', { precision: 20, scale: 6 }), // Monto de gastos administrativos
    overdraftAmount: numeric('overdraft_amount', { precision: 20, scale: 6 }), // Sobregiro si aplica
    previousCreditId: integer('previous_credit_id').references(
      () => credits.id,
    ), // Relación con credito anterior si existe
    status: creditStatusEnum('status').notNull().default('REQUESTED'), // Estado actual del préstamo
    rejectionReason: text('rejection_reason'), // En caso de rechazo
    approvedByUserId: integer('approved_by_user_id').references(() => users.id), // Usuario que aprueba
    notes: text('notes'), // Observaciones
    customReference: varchar('custom_reference', { length: 50 }), // Nro. solicitud personalizado
    currencyCode: currencyCodeEnum('currency_code'), // Moneda del préstamo (VES, USD)
    exchangeRateId: integer('exchange_rate_id').references(
      () => exchangeRates.id,
      { onDelete: 'set null' }, // O 'restrict' según tus necesidades
    ),
    balanceInFavor: numeric('balance_in_favor', { precision: 20, scale: 6 }), // balance a favor si aplica
    commercialHouseId: integer('commercial_house_id'),
    invoiceNumber: varchar('invoice_number', { length: 50 }),
    interestRate: numeric('interest_rate', {
      precision: 5,
      scale: 2,
    }), // Tasa de interés
    termType: varchar('term_type', { length: 20 }), // Tipo de plazo: "CUOTAS" o "PLAZO" (para indicar si se maneja por número de cuotas o un plazo fijo)
    termUnits: integer('term_units'), // Número de cuotas o duración del plazo)
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    associateIdx: index('credit_associate_idx').on(table.associateId),
    statusDateIdx: index('credit_status_date_idx').on(
      table.status,
      table.requestDate,
    ),
  }),
);

// Tabla de amortización del préstamo
export const creditAmortizationSchedule = savingsBanksSchema.table(
  'credit_amortization_schedule',
  {
    id: serial('id').primaryKey(),
    creditId: integer('credit_id')
      .notNull()
      .references(() => credits.id, { onDelete: 'cascade' }), // FK al préstamo
    installmentNumber: integer('installment_number').notNull(), // Número de cuota (1, 2, 3, ...)
    dueDate: date('due_date').notNull(), // Fecha en que debe pagarse esta cuota
    principalAmount: numeric('principal_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto del capital de esta cuota
    interestAmount: numeric('interest_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Monto del interés de esta cuota
    totalInstallmentAmount: numeric('total_installment_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Total a pagar en esta cuota
    principalBalancePending: numeric('principal_balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(), // Saldo de capital pendiente después de esta cuota
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'), // Estado de la cuota (PENDING, PAID, LATE, etc.)
    paidAmount: numeric('paid_amount', { precision: 20, scale: 6 }).default(
      '0.00',
    ), // Monto total pagado hasta ahora para esta cuota
    lastPaymentDate: timestamp('last_payment_date'), // Última fecha en que se realizó un pago para esta cuota
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    creditInstallmentIdx: uniqueIndex(
      'credit_amort_credit_installment_uidx',
    ).on(table.creditId, table.installmentNumber), // Cada cuota debe ser única por credito
    dueDateStatusIdx: index('credit_amort_due_date_status_idx').on(
      table.dueDate,
      table.paymentStatus,
    ), // Para consultas rápidas por vencimiento y estado
  }),
);

// Tabla para registrar cambios de estado del préstamo
export const creditStatusHistory = savingsBanksSchema.table(
  'credit_status_history',
  {
    id: serial('id').primaryKey(),
    creditId: integer('credit_id')
      .notNull()
      .references(() => credits.id, { onDelete: 'cascade' }), // Relación al credito correspondiente
    status: creditStatusEnum('status').notNull(), // Nuevo estado aplicado al credito
    changedAt: timestamp('changed_at').notNull().defaultNow(), // Fecha y hora del cambio de estado
    changedByUserId: integer('changed_by_user_id').references(() => users.id), // Usuario que realizó el cambio
    comment: text('comment'), // Comentario u observación sobre el cambio
  },
  (table) => ({
    creditStatusHistoryIdx: index('credit_status_history_idx').on(table.status),
  }),
);

// tabla registro de los pagos
export const creditPayments = savingsBanksSchema.table(
  'credit_payments',
  {
    id: serial('id').primaryKey(),
    creditId: integer('credit_id')
      .notNull()
      .references(() => credits.id, { onDelete: 'cascade' }),
    paymentDate: timestamp('payment_date').notNull().defaultNow(), // fecha del pago
    paymentType: creditPaymentTypeEnum('payment-type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // Monto pagado
    balancePending: numeric('balance_pending', {
      precision: 20,
      scale: 6,
    }).notNull(), //saldo pendiente luego del pago
    bankId: integer('bank_id').references(() => bankDirectory.id), // Banco que procesó el pago
    paymentMethod: paymentMethodEnum('payment_method').notNull(), // Ej: 'transferencia', 'depósito', 'efectivo'
    transactionReference: text('transaction_reference'), // Número de comprobante, referencia bancaria, etc.
    comment: text('comment'),
    customReference: varchar('custom_reference', { length: 50 }), // Nro. solicitud personalizado
    status: paymentStatus('payment_status').default('DONE').notNull(),
    ...timestamps,
  },
  (table) => ({
    creditPaymentsReferenceIdx: uniqueIndex('credit_payments_uidx').on(
      table.customReference,
    ),
    paymentDateIdx: index('credit_payments_date_idx').on(table.paymentDate),
    customReferenceIdx: index('credit_payments_reference_idx').on(
      table.customReference,
    ),
    transactionReferenceIdx: index(
      'credit_payments_transaction_reference_idx',
    ).on(table.transactionReference),
  }),
);

// tabla registro de los pagos
export const creditPaymentsDetails = savingsBanksSchema.table(
  'credit_payment_details',
  {
    id: serial('id').primaryKey(),
    creditPaymentId: integer('credit_payment_id')
      .notNull()
      .references(() => creditPayments.id, { onDelete: 'cascade' }),
    installmentId: integer('installment_id').references(
      () => creditAmortizationSchedule.id,
      { onDelete: 'cascade' },
    ), // Si aplica a una cuota específica
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // Monto pagado
    ...timestamps,
  },
  (table) => ({
    installmentIdx: index('credit_payments_details_installment_idx').on(
      table.installmentId,
    ),
  }),
);

// Definición de la tabla de liquidaciones
export const liquidationsAssociates = savingsBanksSchema.table(
  'liquidations_associates',
  {
    id: serial('id').primaryKey(),
    associateId: integer('associate_id')
      .notNull()
      .references(() => associates.id, { onDelete: 'restrict' }), // FK al asociado
    liquidationDate: date('liquidation_date').notNull().defaultNow(), // Fecha en que se procesó la liquidación
    effectiveDate: date('effective_date'), // Opcional: Si la liquidación tiene una fecha efectiva diferente
    currencyCode: currencyCodeEnum('currency_code').notNull(), // Moneda de la liquidación
    totalSavingsBalanceAtLiquidation: numeric(
      'total_savings_balance_at_liquidation',
      { precision: 18, scale: 4 },
    ).notNull(), // Saldo de ahorros en el momento de la liquidación
    totalOutstandingLoansAtLiquidation: numeric(
      'total_outstanding_loans_at_liquidation',
      { precision: 18, scale: 4 },
    ).notNull(), // Deuda de préstamos en el momento de la liquidación
    totalOutstandingCreditsAtLiquidation: numeric(
      'total_outstanding_credits_at_liquidation',
      { precision: 18, scale: 4 },
    ).notNull(), // Deuda de créditos en el momento de la liquidación
    netLiquidationAmount: numeric('net_liquidation_amount', {
      precision: 18,
      scale: 4,
    }).notNull(), // El monto neto final (lo que se paga/se debe)
    status: liquidationsStatusEnum('status').notNull().default('REQUESTED'), // 'PROCESSED', 'PENDING_PAYOUT', 'PENDING_COLLECTION', 'CANCELLED'
    payoutTransactionId: integer('payout_transaction_id'), // Opcional: FK a una tabla de transacciones de pago si la tienes
    customReference: varchar('custom_reference', { length: 50 }), // Nro. trasaccion personalizado
    beneficiary: jsonb('beneficiary'), // Información del beneficiario (puede ser un objeto JSON con nombre, cuenta bancaria, etc.)
    notes: text('notes'), // Campo para cualquier nota relevante de la liquidación
    ...timestamps, // created_at y updated_at
  },
  (table) => ({
    // Puedes añadir índices aquí si los necesitas para búsquedas frecuentes
    associateLiquidationIdx: uniqueIndex(
      'liquidations_associate_liquidation_uidx',
    ).on(table.associateId, table.liquidationDate),
  }),
);

export const creditItemSales = savingsBanksSchema.table(
  'credit_item_sales',
  {
    id: serial('id').primaryKey(),
    creditId: integer('credit_id')
      .notNull()
      .references(() => credits.id, { onDelete: 'cascade' }),

    /* Polimorfismo */
    itemType: varchar('item_type', {
      enum: ['PRODUCT', 'SERVICE', 'EXTERNAL'],
    }).notNull(),
    itemId: integer('item_id').notNull(), // id en products o services

    quantity: integer('quantity').notNull().default(1),
    agreedSellingPrice: numeric('agreed_selling_price', {
      precision: 20,
      scale: 6,
    }).notNull(),
    saleDate: date('sale_date').notNull().defaultNow(),
    deliveryStatus: varchar('delivery_status', { length: 50 })
      .notNull()
      .default('ENTREGADO'),
    days: integer('days').references(() => categoryType.id, {
      onDelete: 'cascade',
    }),
    ...timestamps,
  },
  (table) => ({
    creditIdIdx: index('credit_item_sale_credit_id_idx').on(table.creditId),
    itemTypeIdx: index('credit_item_sale_type_idx').on(table.itemType),
  }),
);

export const paymentBatches = savingsBanksSchema.table('payment_batches', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  paymentBatchReference: varchar('payment_batch_reference', {
    length: 50,
  })
    .notNull()
    .unique(),
  description: varchar('description', { length: 100 }),
  status: paymentBatchStatus('status').notNull().default('DRAFT'),
  recordCount: integer('record_count').notNull().default(0),
  totalAmount: numeric('total_amount', { precision: 18, scale: 4 })
    .notNull()
    .default('0'),
  currencyCode: currencyCodeEnum('currency_code').notNull(),
  bankId: integer('bank_id').references(() => bankDirectory.id),
  bankFileName: varchar('bank_file_name', { length: 150 }), // nombre TXT que bajas
  bankReference: varchar('bank_reference', { length: 50 }), // devuelto por banco
  processedAt: timestamp('processed_at'),
  // Tipo de lote: PAYMENT (retiros/liquidaciones) | LOAN_DISBURSEMENT (desembolsos de préstamos)
  batchType: varchar('batch_type', { length: 30 }).notNull().default('PAYMENT'),
  ...timestamps,
});

export const paymentBatchItems = savingsBanksSchema.table(
  'payment_batch_items',
  {
    id: serial('id').primaryKey(),
    paymentBatchId: integer('payment_batch_id').references(
      () => paymentBatches.id,
      { onDelete: 'cascade' },
    ),
    itemType: paymentBatchItemType('item_type').notNull(), // LOAN / WITHDRAWAL / LIQUIDATION
    sourceId: integer('source_id').notNull(), // id en loans, withdrawals o liquidations
    associateAccountId: integer('associate_account_id').references(
      () => associateAccounts.id,
    ),
    beneficiaryAccountNumber: varchar('beneficiary_account_number', {
      length: 50,
    }).notNull(),
    beneficiaryAccountType: varchar('beneficiary_account_type', {
      length: 20,
    }).notNull(), // AHORRO / CORRIENTE
    beneficiaryId: varchar('beneficiary_id', { length: 20 }).notNull(), // CI / RIF
    beneficiaryName: varchar('beneficiary_name', { length: 150 }).notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING / PROCESSED / REJECTED
    rejectionReason: text('rejection_reason'),
    ...timestamps,
  },
);
