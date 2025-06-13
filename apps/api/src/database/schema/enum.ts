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
    // 1. Contribuciones (Personal y Empleador)
    'SAVING_CONTRIBUTION', // Aporte regular o adicional del asociado a su cuenta de ahorros.
    'EMPLOYER_CONTRIBUTION', // Aporte realizado por el empleador a la cuenta del asociado (si aplica).

    // 2. Retiros (Parciales y Liquidaciones)
    'SAVING_WITHDRAWAL', // Retiro de fondos de la cuenta de ahorros del asociado (parcial o liquidación).

    // 3. Débito por Gasto Administrativo por Retiros
    'WITHDRAWAL_FEE_DEBIT', // Débito específico por comisiones asociadas a retiros (parciales o liquidaciones).
    // Si necesitas un tipo genérico para otros gastos administrativos no específicos de retiro:

    // 4. Préstamos (Desembolsos)
    'LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo desembolsado a la cuenta del asociado.
    'CREDIT_DISBURSEMENT_CREDIT', //acreditacion de monto de un credito

    // 5. Débito por Gastos Administrativos por Préstamos y Pagos de Préstamos
    'LOAN_PAYMENT_DEBIT', // Débito por el pago de una cuota de préstamo realizado por el asociado.
    'CREDIT_PAYMENT_DEBIT', // Débito por el pago de una cuota de credito realizado por el asociado.
    'LOAN_INTEREST_DEBIT', // Débito específico por los intereses generados por un préstamo.
    'LOAN_OVERPAYMENT_CREDIT', //credito por sobrepago de prestamo
    'CREDIT_OVERPAYMENT_CREDIT', //credito por sobrepago de credito
    // Considera si necesitas un tipo de débito específico para gastos de originación/manejo de préstamos:
    'LOAN_FEE_DEBIT', // Débito por comisiones administrativas asociadas a préstamos.

    // 6. Créditos (Otros Créditos / No Préstamos)
    'DIVIDEND_CREDIT', // Acreditación de dividendos o excedentes a la cuenta del asociado.
    'FEE_REIMBURSEMENT_CREDIT', // Crédito por el reintegro de una comisión o cargo cobrado previamente.

    // 7. Débito por Gastos Administrativos por Créditos (si aplica a 'OTHER_CREDIT' o 'DIVIDEND_CREDIT')
    // Si un 'OTHER_CREDIT' o 'DIVIDEND_CREDIT' tuviera un cargo administrativo asociado:
    'CREDIT_ADMIN_FEE_DEBIT', // Débito por gastos administrativos asociados a ciertos créditos.

    // 8. Ajustes Varios
    'ADJUSTMENT_CREDIT', // Crédito por ajustes o correcciones positivas en el saldo de la cuenta o haberes.
    'ADJUSTMENT_DEBIT', // Débito por ajustes o correcciones negativas en el saldo de la cuenta o haberes.
    'FEE_CORRECTION_DEBIT', // Débito para corregir un cobro de cuota incorrecto (o cualquier comisión).

    // 9. Otros (Catch-all)
    'OTHER_CREDIT', // Otros tipos de créditos no especificados en las categorías anteriores.
    'OTHER_DEBIT', // Otros tipos de débitos no especificados en las categorías anteriores.
    'FEE_DEBIT', // Débito genérico por comisiones o cargos varios no cubiertos por otros tipos específicos de FEE_DEBIT.
    'ADMIN_FEE_DEBIT', // Gasto administrativo general que puede aplicarse a retiros, etc.
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
