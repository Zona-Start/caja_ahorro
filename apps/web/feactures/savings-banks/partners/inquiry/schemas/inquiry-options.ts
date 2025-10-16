export const LOAN_STATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente por Lote',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso Reversado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  ADJUSTED: 'Ajustado',
} as const;

export const CREDIT_STATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
} as const;

export const WITHDRAWAL_STATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente por Lote',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso Reversado',
  ADJUSTED: 'Ajustado',
} as const;

export const MOVEMENT_TYPES = {
  // 1. Contribuciones y Aportes a Cuentas de Ahorro
  SAVING_CONTRIBUTION: 'Aporte del Asociado',
  EMPLOYER_CONTRIBUTION: 'Aporte del Empleador',
  VOLUNTARY_SAVINGS: 'Aporte Voluntario',

  // 2. Retiros de Cuentas de Ahorro
  SAVING_WITHDRAWAL: 'Retiro de Ahorro',

  // 3. Desembolsos de Préstamos y Créditos
  LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo',
  SPECIAL_LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo Especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Comercial',
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Especial',

  // 4. Refinanciamiento de Préstamos
  LOAN_REFINANCING_DEBIT: 'Refinanciamiento de Préstamo (Débito)',
  LOAN_REFINANCING_CREDIT: 'Refinanciamiento de Préstamo (Crédito)',

  // 5. Pagos de Préstamos y Créditos
  LOAN_PAYMENT_DEBIT: 'Pago de Préstamo',
  COMMERCIAL_CREDIT_PAYMENT_DEBIT: 'Pago de crédito Comercial',

  // 6. Sobregiros y Reintegros de Préstamos/Créditos
  LOAN_REIMBURSEMENT_CREDIT: 'Reintegro de Préstamo',
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT: 'Reintegro de Crédito Comercial',
  LOAN_OVERPAYMENT_CREDIT: 'Pago de más de préstamo',
  COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT: 'Pago de más de Crédito Comercial',

  // 7. Cargos y Comisiones Relacionados con Préstamos/Créditos
  LOAN_PARTIAL_DISBURSEMENT_CREDIT: 'Desembolso Parcial de Préstamo',

  // 8. Otros Cargos y Reversiones
  WITHDRAWAL_FEE_DEBIT: 'Comisión por Retiro',
  LOAN_INTEREST_DEBIT: 'Interés de Préstamo',
  LOAN_FEE_DEBIT: 'Comisión de Préstamo',
  LOAN_ADMIN_FEE_DEBIT: 'Comisión de Administración de Préstamo',
  LATE_PAYMENT_FEE_DEBIT: 'Comisión por Pago Tardío',
  PAYMENT_REVERSAL_DEBIT: 'Reversión de Pago',
  CREDIT_ADMIN_FEE_DEBIT: 'Comisión de Administración de Crédito',

  // 9. Ajustes y Correcciones
  DIVIDEND_CREDIT: 'Excedentes',
  FEE_REIMBURSEMENT_CREDIT: 'Reintegro de Comisión',
  ADJUSTMENT_CREDIT: 'Ajuste (Crédito)',

  // 10. Otros (Uso general para transacciones no clasificadas en las anteriores)
  ADJUSTMENT_DEBIT: 'Ajuste (Débito)',
  FEE_CORRECTION_DEBIT: 'Corrección de Comisión',
  ADMIN_FEE_DEBIT: 'Comisión de Administración',
  OTHER_DEBIT: 'Otro (Débito)',
  FEE_DEBIT: 'Comisión',

  // 11. Tipos genéricos
  OTHER_CREDIT: 'Otro (Crédito)',

  // 12. Liquidación
  LIQUIDATION_BALANCE: 'Liquidación de Haberes',

  // Reversiones de Desembolsos
  LOAN_DISBURSEMENT_REVERSAL_DEBIT: 'Reversión de Desembolso de Préstamo',
  SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Préstamo Especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Crédito Comercial',
  SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Crédito Especial',

  // Reversiones de Pagos
  LOAN_PAYMENT_REVERSAL_CREDIT: 'Reversión de Pago de Préstamo',
  COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT:
    'Reversión de Pago de Crédito Comercial',

  // Reversiones de Retiros
  SAVING_WITHDRAWAL_REVERSAL_CREDIT: 'Reversión de Retiro de Ahorro',

  // Reversiones de Liquidación
  LIQUIDATION_BALANCE_REVERSAL_CREDIT: 'Reversión de Liquidación de Haberes',

  // Ajustes Contables Específicos
  ACCOUNTING_ADJUSTMENT_DEBIT: 'Ajuste Contable (Débito)',
  ACCOUNTING_ADJUSTMENT_CREDIT: 'Ajuste Contable (Crédito)',
} as const;

export const PAYMENT_METHOD_TYPES = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro',
  MOBILE_PAYMENT: 'Pago Móvil',
} as const;

export const ASSOCIATE_STATUS_TYPES = {
  ACTIVE: 'Activo',
  INACTIVE: 'inactivo',
  SUSPENDED: 'Suspendido',
  LOCKED: 'Bloqueado',
  RETIRED: 'Retirado',
  ARCHIVED: 'Archivado',
} as const;

export const PAYMENT_LOAN_STATUS = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELED: 'Cancelado',
} as const;

export const CREDIT_SATUS = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
} as const;

export const WITHDRAWAL_SATUS = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente por Lote',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso Reversado',
  ADJUSTED: 'Ajustado',
} as const;
