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
  // 1. Contribuciones y Aportes a Cuentas de Ahorro
  SAVING_CONTRIBUTION = 'SAVING_CONTRIBUTION', // Aporte regular o adicional del asociado a su cuenta de ahorros (Abonos del asociado).
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION', // Aporte realizado por el empleador a la cuenta del asociado (Abonos patronales).
  VOLUNTARY_SAVINGS = 'VOLUNTARY_SAVINGS',

  // 2. Retiros de Cuentas de Ahorro
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL', // Retiro de fondos de la cuenta de ahorros del asociado (parcial o liquidación) (retiros parciales).

  // 3. Desembolsos de Préstamos / Créditos
  LOAN_DISBURSEMENT_CREDIT = 'LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo ordinario desembolsado a la cuenta del asociado (Monto prestamo ordinario aprobado).
  SPECIAL_LOAN_DISBURSEMENT_CREDIT = 'SPECIAL_LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo con cuotas especiales desembolsado (monto prestamo con cuotas especiales).
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT = 'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT', // Acreditación del monto de un crédito comercial desembolsado (creditos comerciales).
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT = 'SPECIAL_CREDIT_DISBURSEMENT_CREDIT', // Acreditación del monto de un crédito con cuotas especiales desembolsado (creditos con cuotas especiales).

  // 4. Refinanciamiento de Préstamos / Créditos (Manejo de saldo anterior)
  LOAN_REFINANCING_DEBIT = 'LOAN_REFINANCING_DEBIT', // Débito del saldo anterior de un préstamo al refinanciarlo.
  LOAN_REFINANCING_CREDIT = 'LOAN_REFINANCING_CREDIT', // Crédito del nuevo monto de un préstamo refinanciado (similar a un nuevo desembolso, pero específicamente por refinanciamiento).
  // Nota: Un refinanciamiento a menudo implica un LOAN_REFINANCING_DEBIT (cancelando el viejo) y LOAN_DISBURSEMENT_CREDIT (el nuevo),
  // pero estos tipos específicos ayudan a rastrear el evento de refinanciamiento.

  // 5. Pagos de Préstamos y Créditos
  LOAN_PAYMENT_DEBIT = 'LOAN_PAYMENT_DEBIT', // Débito por el pago de una cuota de préstamo (pagos de prestamos).
  COMMERCIAL_CREDIT_PAYMENT_DEBIT = 'COMMERCIAL_CREDIT_PAYMENT_DEBIT', // Débito por el pago de una cuota de crédito comercial (pagos de creditos).

  // 6. Reintegros y Sobrecargos de Préstamos/Créditos
  LOAN_REIMBURSEMENT_CREDIT = 'LOAN_REIMBURSEMENT_CREDIT', // Crédito por un reintegro de monto a un préstamo (ej. devolución de un cobro erróneo) (reintegros de prestamos).
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT = 'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT', // Crédito por un reintegro de monto a un credito comercial  (ej. devolución de un cobro erróneo) (reintegros de creditos).
  LOAN_OVERPAYMENT_CREDIT = 'LOAN_OVERPAYMENT_CREDIT', // Crédito generado por un sobrepago de préstamo que queda a favor del asociado.
  COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT = 'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT', // Crédito generado por un sobrepago de crédito comercial.

  // 7. Préstamos con Retiros Parciales (Si esto significa un préstamo que se desembolsa en partes a lo largo del tiempo)
  // Este es un concepto de desembolso, por lo que el tipo de desembolso existente LOAN_DISBURSEMENT_CREDIT
  // o SPECIAL_LOAN_DISBURSEMENT_CREDIT podría usarse para cada parte desembolsada.
  // Si necesitas diferenciar cada "retiro" como un evento de préstamo en sí, podrías usar:
  LOAN_PARTIAL_DISBURSEMENT_CREDIT = 'LOAN_PARTIAL_DISBURSEMENT_CREDIT', // Para préstamos que se desembolsan en múltiples partes.

  // 8. Gastos y Cargos Varios (Comisiones, Intereses, etc.)
  WITHDRAWAL_FEE_DEBIT = 'WITHDRAWAL_FEE_DEBIT', // Débito por comisiones asociadas a retiros de ahorro.
  LOAN_INTEREST_DEBIT = 'LOAN_INTEREST_DEBIT', // Débito específico por los intereses generados por un préstamo.
  LOAN_FEE_DEBIT = 'LOAN_FEE_DEBIT', // Débito por otras comisiones o cargos de préstamo (ej. gastos de apertura).
  LOAN_ADMIN_FEE_DEBIT = 'LOAN_ADMIN_FEE_DEBIT', // Débito por gastos administrativos asociados a prestamos.
  LATE_PAYMENT_FEE_DEBIT = 'LATE_PAYMENT_FEE_DEBIT', // **RECOMENDADO:** Débito por recargos/multas por pagos tardíos.
  PAYMENT_REVERSAL_DEBIT = 'PAYMENT_REVERSAL_DEBIT', // **RECOMENDADO:** Débito para revertir un pago previo (ej. cheque rebotado).
  // Nota: Si un pago revertido implica una comisión por el rebote, tendrías LATE_PAYMENT_FEE_DEBIT o un nuevo BOUNCE_FEE_DEBIT.
  CREDIT_ADMIN_FEE_DEBIT = 'CREDIT_ADMIN_FEE_DEBIT', // Débito por gastos administrativos asociados a ciertos créditos (no préstamos).

  // 9. Otros Créditos (Ingresos no relacionados con Aportes/Préstamos)
  DIVIDEND_CREDIT = 'DIVIDEND_CREDIT', // Acreditación de dividendos o excedentes.
  FEE_REIMBURSEMENT_CREDIT = 'FEE_REIMBURSEMENT_CREDIT', // Reintegro de una comisión o cargo cobrado previamente.
  ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT', // Crédito por ajustes o correcciones positivas.

  // 10. Otros Débitos (Egresos no relacionados con Préstamos/Retiros directos)
  ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT', // Débito por ajustes o correcciones negativas.
  FEE_CORRECTION_DEBIT = 'FEE_CORRECTION_DEBIT', // Débito para corregir un cobro incorrecto de una comisión.
  ADMIN_FEE_DEBIT = 'ADMIN_FEE_DEBIT', // Gasto administrativo general (ej. mantenimiento de cuenta).
  OTHER_DEBIT = 'OTHER_DEBIT', // Otros tipos de débitos no especificados.
  FEE_DEBIT = 'FEE_DEBIT', // Débito genérico por comisiones o cargos varios no cubiertos por otros tipos específicos.

  // 11. Tipos Genéricos (Si aún necesitas más flexibilidad)
  OTHER_CREDIT = 'OTHER_CREDIT', // Otros tipos de créditos no especificados.

  //12. liqudiacion

  LIQUIDATION_BALANCE = 'LIQUIDATION_BALANCE',
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
