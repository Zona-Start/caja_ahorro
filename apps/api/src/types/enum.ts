// Enums Generales
export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  LOCKED = 'LOCKED',
  RETIRED = 'RETIRED',
}

export enum GenderEnum {
  FEMENINO = 'FEMENINO',
  MASCULINO = 'MASCULINO',
  OTRO = 'OTRO',
}

export enum NationalityEnum {
  VENEZOLANO = 'VENEZOLANO',
  EXTRANJERO = 'EXTRANJERO',
}

export enum CurrencyCodeEnum {
  VES = 'VES',
  USD = 'USD',
  EUR = 'EUR',
}

// Enum Tipos de Cuenta Contable
export enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  MEMORANDUM = 'MEMORANDUM',
}

export enum AccountNatureEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

// Enum Estado Ciclo Contable
export enum CycleStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CLOSING = 'CLOSING',
}

// Enum Estado Préstamo
export enum LoanStatusEnum {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  IN_PAYMENT = 'IN_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

// Enum Estado Credito
export enum CreditStatusEnum {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  IN_PAYMENT = 'IN_PAYMENT',
  PAID = 'PAID',
}

// Enum Estado Cuota Préstamo
export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

// Enum Tipo Movimiento Cuenta Asociado
// Enum Tipo Movimiento Cuenta Asociado
export enum AssociateMovementTypeEnum {
  // 1. Contribuciones y Aportes
  SAVING_CONTRIBUTION = 'SAVING_CONTRIBUTION', // Aporte regular o adicional del asociado a su cuenta de ahorros.
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION', // Aporte realizado por el empleador a la cuenta del asociado.

  // 2. Retiros y Liquidaciones
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL', // Retiro de fondos de la cuenta de ahorros del asociado (parcial o liquidación).

  // 3. Gastos Administrativos por Retiros
  WITHDRAWAL_FEE_DEBIT = 'WITHDRAWAL_FEE_DEBIT', // Débito específico por comisiones asociadas a retiros.

  // 4. Préstamos (Desembolsos)
  LOAN_DISBURSEMENT_CREDIT = 'LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo desembolsado a la cuenta del asociado.
  CREDIT_DISBURSEMENT_CREDIT = 'CREDIT_DISBURSEMENT_CREDIT',

  // 5. Pagos y Gastos de Préstamos
  LOAN_PAYMENT_DEBIT = 'LOAN_PAYMENT_DEBIT', // Débito por el pago de una cuota de préstamo realizado por el asociado.
  CREDIT_PAYMENT_DEBIT = 'CREDIT_PAYMENT_DEBIT', // Débito por el pago de una cuota de credito realizado por el asociado.
  LOAN_INTEREST_DEBIT = 'LOAN_INTEREST_DEBIT', // Débito específico por los intereses generados por un préstamo.
  LOAN_FEE_DEBIT = 'LOAN_FEE_DEBIT', // debito por prestamo
  LOAN_OVERPAYMENT_CREDIT = 'LOAN_OVERPAYMENT_CREDIT', //CRÉDITO POR SOBREPAGO DE PRÉSTAMO
  CREDIT_OVERPAYMENT_CREDIT = 'CREDIT_OVERPAYMENT_CREDIT', // CREDITO POR SOBREPAGO DE CREDITO
  // Podrías añadir LOAN_FEE_DEBIT = 'LOAN_FEE_DEBIT' si hay comisiones por préstamos separadas de los intereses.

  // 6. Otros Créditos (No Préstamos)
  DIVIDEND_CREDIT = 'DIVIDEND_CREDIT', // Acreditación de dividendos o excedentes a la cuenta del asociado.
  FEE_REIMBURSEMENT_CREDIT = 'FEE_REIMBURSEMENT_CREDIT', // Crédito por el reintegro de una comisión o cargo cobrado previamente.

  // 7. Débito por Gastos Administrativos por Créditos (si aplica a 'OTHER_CREDIT' o 'DIVIDEND_CREDIT')
  CREDIT_ADMIN_FEE_DEBIT = 'CREDIT_ADMIN_FEE_DEBIT',

  // 7. Ajustes y Correcciones
  ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT', // Crédito por ajustes o correcciones positivas en el saldo o haberes.
  ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT', // Débito por ajustes o correcciones negativas en el saldo o haberes.
  FEE_CORRECTION_DEBIT = 'FEE_CORRECTION_DEBIT', // Débito para corregir un cobro incorrecto de una comisión.

  // 8. Otros Genéricos
  OTHER_CREDIT = 'OTHER_CREDIT', // Otros tipos de créditos no especificados en categorías anteriores.
  OTHER_DEBIT = 'OTHER_DEBIT', // Otros tipos de débitos no especificados en categorías anteriores.
  FEE_DEBIT = 'FEE_DEBIT', // Débito genérico por comisiones o cargos varios no específicos.
  ADMIN_FEE_DEBIT = 'ADMIN_FEE_DEBIT', // Gasto administrativo general que puede aplicarse a retiros, etc.
}

// Enum Estado Conciliación
export enum ReconciliationStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
}

export enum ReconciliationItemStatusEnum {
  PENDING = 'PENDING',
  RECONCILED = 'RECONCILED',
  MANUAL_MATCH = 'MANUAL_MATCH',
  ADJUSTMENT = 'ADJUSTMENT',
  EXCLUDED = 'EXCLUDED',
}

// Enum Acción Auditoría
export enum ActionEnumAudit {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PROCESS = 'PROCESS',
}

export enum ActionEnumAuditAuth {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

// Enum Tipo Cuenta Asociado (Ejemplo, podría ser FK a categoryType)
export enum AssociateAccountTypeEnum {
  SAVINGS = 'SAVINGS',
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION',
  MANDATORY_SAVINGS = 'MANDATORY_SAVINGS',
}

export enum paymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DEPOSIT = 'DEPOSIT',
  OTHER = 'OTHER',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
}

export enum loanModalityTypeEnum {
  ORDINARY = 'ORDINARY',
  SPECIAL_QUOTAS = 'SPECIAL_QUOTAS',
}

export enum loanPaymetTypeEnum {
  CANCELLATION = 'CANCELLATION',
  PAYING = 'PAYING',
}

export enum creditModalityTypeEnum {
  ORDINARY = 'ORDINARY',
  SPECIAL_QUOTAS = 'SPECIAL_QUOTAS',
}

export enum creditPaymetTypeEnum {
  CANCELLATION = 'CANCELLATION',
  PAYING = 'PAYING',
}
