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

// Enum Estado Cuota Préstamo
export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

// Enum Tipo Movimiento Cuenta Asociado
export enum AssociateMovementTypeEnum {
  SAVING_CONTRIBUTION = 'SAVING_CONTRIBUTION',
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION',
  DIVIDEND_CREDIT = 'DIVIDEND_CREDIT',
  LOAN_DISBURSEMENT_CREDIT = 'LOAN_DISBURSEMENT_CREDIT',
  OTHER_CREDIT = 'OTHER_CREDIT',
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL',
  LOAN_PAYMENT_DEBIT = 'LOAN_PAYMENT_DEBIT',
  FEE_DEBIT = 'FEE_DEBIT',
  OTHER_DEBIT = 'OTHER_DEBIT',
  ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT',
  ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT',
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
