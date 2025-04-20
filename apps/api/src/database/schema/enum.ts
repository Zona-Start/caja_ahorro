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
    'SAVING_CONTRIBUTION',
    'EMPLOYER_CONTRIBUTION',
    'DIVIDEND_CREDIT',
    'LOAN_DISBURSEMENT_CREDIT',
    'OTHER_CREDIT',
    'SAVING_WITHDRAWAL',
    'LOAN_PAYMENT_DEBIT',
    'FEE_DEBIT',
    'OTHER_DEBIT',
    'ADJUSTMENT_CREDIT',
    'ADJUSTMENT_DEBIT',
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
]);
