import { pgEnum } from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';

// Enums Generales
export const statusEnum = pgEnum('status_enum', [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'SUSPENDED',
  'CLOSED',
  'LOCKED',
  'RETIRED',
]);
export const genderEnum = authSchema.enum('gender', [
  'FEMENINO',
  'MASCULINO',
  'OTRO',
]);
export const nationalityEnum = pgEnum('nationality', [
  'VENEZOLANO',
  'EXTRANJERO',
]);
export const currencyCodeEnum = pgEnum('currency_code_enum', [
  'VES',
  'USD',
  'EUR',
]); // Ampliar según sea necesario

// Enum Tipos de Cuenta Contable
export const accountTypeEnum = pgEnum('account_type_enum', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'MEMORANDUM',
]); // Cambié ORDEN por MEMORANDUM
export const accountNatureEnum = pgEnum('account_nature_enum', [
  'DEBIT',
  'CREDIT',
]); // Naturaleza Deudora o Acreedora

// Enum Estado Ciclo Contable
export const cycleStatusEnum = pgEnum('cycle_status_enum', [
  'OPEN',
  'CLOSED',
  'CLOSING',
]);

// Enum Estado Préstamo
export const loanStatusEnum = pgEnum('loan_status_enum', [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'DISBURSED',
  'IN_PAYMENT',
  'PAID',
  'CANCELLED',
  'OVERDUE',
]);

// Enum Estado Créditos
export const creditStatusEnum = pgEnum('credit_status_enum', [
  'REQUESTED',
  'APPROVED',
  'IN_PAYMENT',
  'PAID',
]);

// Enum Estado Cuota Préstamo
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  'PENDING',
  'PAID',
  'OVERDUE',
  'PARTIAL',
]);

// Enum Tipo Movimiento Cuenta Asociado
export const associateMovementTypeEnum = pgEnum(
  'associate_movement_type_enum',
  [
    // 1. Contribuciones y Aportes a Cuentas de Ahorro
    'SAVING_CONTRIBUTION',
    'EMPLOYER_CONTRIBUTION',
    'VOLUNTARY_SAVINGS',

    // 2. Retiros de Cuentas de Ahorro
    'SAVING_WITHDRAWAL',

    // 3. Desembolsos de Préstamos y Créditos
    'LOAN_DISBURSEMENT_CREDIT',
    'SPECIAL_LOAN_DISBURSEMENT_CREDIT',
    'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT',
    'SPECIAL_CREDIT_DISBURSEMENT_CREDIT',

    // 4. Refinanciamiento de Préstamos
    'LOAN_REFINANCING_DEBIT',
    'LOAN_REFINANCING_CREDIT',

    // 5. Pagos de Préstamos y Créditos
    'LOAN_PAYMENT_DEBIT',
    'COMMERCIAL_CREDIT_PAYMENT_DEBIT',

    // 6. Sobregiros y Reintegros de Préstamos/Créditos
    'LOAN_REIMBURSEMENT_CREDIT',
    'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT',
    'LOAN_OVERPAYMENT_CREDIT', // <<-- ¡QUITADO EL ESPACIO AQUÍ!
    'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',

    // 7. Cargos y Comisiones Relacionados con Préstamos/Créditos
    'LOAN_PARTIAL_DISBURSEMENT_CREDIT',

    // 8. Otros Cargos y Reversiones
    'WITHDRAWAL_FEE_DEBIT',
    'LOAN_INTEREST_DEBIT',
    'LOAN_FEE_DEBIT',
    'LOAN_ADMIN_FEE_DEBIT',
    'LATE_PAYMENT_FEE_DEBIT',
    'PAYMENT_REVERSAL_DEBIT',
    'CREDIT_ADMIN_FEE_DEBIT',

    // 9. Ajustes y Correcciones
    'DIVIDEND_CREDIT',
    'FEE_REIMBURSEMENT_CREDIT',
    'ADJUSTMENT_CREDIT',

    // 10. Otros (Uso general para transacciones no clasificadas en las anteriores)
    'ADJUSTMENT_DEBIT',
    'FEE_CORRECTION_DEBIT',
    'ADMIN_FEE_DEBIT',
    'OTHER_DEBIT',
    'FEE_DEBIT',

    //11. tipos genericos
    'OTHER_CREDIT',

    //12. liqudiacion
    'LIQUIDATION_BALANCE',
  ],
);

// Enum Estado Conciliación
export const reconciliationStatusEnum = pgEnum('reconciliation_status_enum', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'REVIEWED',
]);
export const reconciliationItemStatusEnum = pgEnum(
  'reconciliation_item_status_enum',
  ['PENDING', 'RECONCILED', 'MANUAL_MATCH', 'ADJUSTMENT', 'EXCLUDED'],
);

// Enum Acción Auditoría
export const actionEnumAudit = pgEnum('audit_action_enum', [
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'PROCESS',
]);
export const actionEnumAuditAuth = pgEnum('audit_auth_action_enum', [
  'LOGIN',
  'LOGOUT',
]);

// Enum Tipo Cuenta Asociado (Ejemplo, podría ser FK a categoryType)
export const associateAccountTypeEnum = pgEnum('associate_account_type_enum', [
  'SAVINGS',
  'EMPLOYER_CONTRIBUTION',
  'MANDATORY_SAVINGS',
]);

export const paymentMethodEnum = pgEnum('payment_method_enum', [
  'CASH', // Efectivo
  'BANK_TRANSFER', // Transferencia bancaria
  'CHECK', // Cheque
  'DEPOSIT', // Depósito
  'OTHER', // Otro método
  'MOBILE_PAYMENT', //PAGO MOVIL
]);

// Enum Modalidad de prestamos
export const loanModalityTypeEnum = pgEnum('loan_modality_type_enum', [
  'ORDINARY',
  'SPECIAL_QUOTAS',
]);

// Enum Modalidad de creditos
export const creditModalityTypeEnum = pgEnum('credit_modality_type_enum', [
  'ORDINARY',
  'SPECIAL_QUOTAS',
]);

// Enum Modalidad de pago de prestamo
export const loanPaymentTypeEnum = pgEnum('loan_payment_type_enum', [
  'PAYING',
  'CANCELLATION',
]);

// Enum Modalidad de pago de prestamo
export const creditPaymentTypeEnum = pgEnum('credit_payment_type_enum', [
  'PAYING',
  'CANCELLATION',
]);
