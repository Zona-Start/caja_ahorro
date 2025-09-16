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
  EMPLOYER_CONTRIBUTION: 'Aporte del empleador',
  VOLUNTARY_SAVINGS: 'Aporte voluntario',

  // 2. Retiros de Cuentas de Ahorro
  SAVING_WITHDRAWAL: 'Retiro de ahorro',

  // 3. Desembolsos de Préstamos y Créditos
  LOAN_DISBURSEMENT_CREDIT: 'Desembolso de préstamo',
  SPECIAL_LOAN_DISBURSEMENT_CREDIT: 'Desembolso de préstamo especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de crédito comercial',
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de crédito especial',

  // 4. Refinanciamiento de Préstamos
  LOAN_REFINANCING_DEBIT: 'Refinanciamiento de préstamo (Débito)',
  LOAN_REFINANCING_CREDIT: 'Refinanciamiento de préstamo (Crédito)',

  // 5. Pagos de Préstamos y Créditos
  LOAN_PAYMENT_DEBIT: 'Pago de préstamo',
  COMMERCIAL_CREDIT_PAYMENT_DEBIT: 'Pago de crédito comercial',

  // 6. Sobregiros y Reintegros de Préstamos/Créditos
  LOAN_REIMBURSEMENT_CREDIT: 'Reintegro de préstamo',
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT: 'Reintegro de crédito comercial',
  LOAN_OVERPAYMENT_CREDIT: 'Pago de más de préstamo',
  COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT: 'Pago de más de crédito comercial',

  // 7. Cargos y Comisiones Relacionados con Préstamos/Créditos
  LOAN_PARTIAL_DISBURSEMENT_CREDIT: 'Desembolso parcial de préstamo',

  // 8. Otros Cargos y Reversiones
  WITHDRAWAL_FEE_DEBIT: 'Comisión por retiro',
  LOAN_INTEREST_DEBIT: 'Interés de préstamo',
  LOAN_FEE_DEBIT: 'Comisión de préstamo',
  LOAN_ADMIN_FEE_DEBIT: 'Comisión de administración de préstamo',
  LATE_PAYMENT_FEE_DEBIT: 'Comisión por pago tardío',
  PAYMENT_REVERSAL_DEBIT: 'Reversión de pago',
  CREDIT_ADMIN_FEE_DEBIT: 'Comisión de administración de crédito',

  // 9. Ajustes y Correcciones
  DIVIDEND_CREDIT: 'Excedentes',
  FEE_REIMBURSEMENT_CREDIT: 'Reintegro de comisión',
  ADJUSTMENT_CREDIT: 'Ajuste (Crédito)',

  // 10. Otros (Uso general para transacciones no clasificadas en las anteriores)
  ADJUSTMENT_DEBIT: 'Ajuste (Débito)',
  FEE_CORRECTION_DEBIT: 'Corrección de comisión',
  ADMIN_FEE_DEBIT: 'Comisión de administración',
  OTHER_DEBIT: 'Otro (Débito)',
  FEE_DEBIT: 'Comisión',

  // 11. Tipos genéricos
  OTHER_CREDIT: 'Otro (Crédito)',

  // 12. Liquidación
  LIQUIDATION_BALANCE: 'Liquidación de balance',

  // Reversiones de Desembolsos
  LOAN_DISBURSEMENT_REVERSAL_DEBIT: 'Reversión de desembolso de préstamo',
  SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de desembolso de préstamo especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de desembolso de crédito comercial',
  SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de desembolso de crédito especial',

  // Reversiones de Pagos
  LOAN_PAYMENT_REVERSAL_CREDIT: 'Reversión de pago de préstamo',
  COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT:
    'Reversión de pago de crédito comercial',

  // Reversiones de Retiros
  SAVING_WITHDRAWAL_REVERSAL_CREDIT: 'Reversión de retiro de ahorro',

  // Reversiones de Liquidación
  LIQUIDATION_BALANCE_REVERSAL_CREDIT: 'Reversión de liquidación de balance',

  // Ajustes Contables Específicos
  ACCOUNTING_ADJUSTMENT_DEBIT: 'Ajuste contable (Débito)',
  ACCOUNTING_ADJUSTMENT_CREDIT: 'Ajuste contable (Crédito)',
} as const;

export const PAYMENT_METHOD_TYPES = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro',
  MOBILE_PAYMENT: 'Pago Móvil',
} as const;
