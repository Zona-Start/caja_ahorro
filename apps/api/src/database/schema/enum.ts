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
    'SAVING_CONTRIBUTION', // Aporte regular o adicional del asociado a su cuenta de ahorros.
    'EMPLOYER_CONTRIBUTION', // Aporte realizado por el empleador a la cuenta del asociado (si aplica).
    'DIVIDEND_CREDIT', // Acreditación de dividendos o excedentes a la cuenta del asociado.
    'LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo a la cuenta del asociado.
    'OTHER_CREDIT', // Otros tipos de créditos no especificados.
    'SAVING_WITHDRAWAL', // Retiro de fondos de la cuenta de ahorros del asociado.
    'LOAN_PAYMENT_DEBIT', // Débito por el pago de una cuota de préstamo realizado por el asociado.
    'FEE_DEBIT', // Débito genérico por comisiones o cargos varios.
    'WITHDRAWAL_FEE_DEBIT', // Débito específico por comisiones asociadas a retiros.
    'LOAN_INTEREST_DEBIT', // Débito específico por los intereses generados por un préstamo.
    'OTHER_DEBIT', // Otros tipos de débitos no especificados.
    'ADJUSTMENT_CREDIT', // Crédito por ajustes o correcciones en el saldo de la cuenta.
    'ADJUSTMENT_DEBIT', // Débito por ajustes o correcciones en el saldo de la cuenta.
    'FEE_REIMBURSEMENT_CREDIT', // Crédito por el reintegro de una comisión o cargo cobrado previamente (asumiendo que "Reintegro de Cuota" es un crédito).
    // Si "Reintegro de Cuota" fuera un débito, usarías algo como:
    'FEE_CORRECTION_DEBIT', // Débito para corregir un cobro de cuota incorrecto.
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
