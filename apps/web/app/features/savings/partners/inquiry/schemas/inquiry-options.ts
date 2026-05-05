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
  PROCESSED: 'Procesado',
} as const;

export const MOVEMENT_TYPES = {
  SAVING_CONTRIBUTION: 'Aporte del Asociado',
  EMPLOYER_CONTRIBUTION: 'Aporte del Empleador',
  VOLUNTARY_SAVINGS: 'Aporte Voluntario',
  SAVING_WITHDRAWAL: 'Retiro de Ahorro',
  LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo',
  SPECIAL_LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo Especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Comercial',
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Especial',
  LOAN_REFINANCING_DEBIT: 'Refinanciamiento de Préstamo (Débito)',
  LOAN_REFINANCING_CREDIT: 'Refinanciamiento de Préstamo (Crédito)',
  LOAN_PAYMENT_DEBIT: 'Pago de Préstamo',
  COMMERCIAL_CREDIT_PAYMENT_DEBIT: 'Pago de crédito Comercial',
  LOAN_REIMBURSEMENT_CREDIT: 'Reintegro de Préstamo',
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT: 'Reintegro de Crédito Comercial',
  LOAN_OVERPAYMENT_CREDIT: 'Pago de más de préstamo',
  COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT: 'Pago de más de Crédito Comercial',
  LOAN_PARTIAL_DISBURSEMENT_CREDIT: 'Desembolso Parcial de Préstamo',
  WITHDRAWAL_FEE_DEBIT: 'Comisión por Retiro',
  LOAN_INTEREST_DEBIT: 'Interés de Préstamo',
  LOAN_FEE_DEBIT: 'Comisión de Préstamo',
  LOAN_ADMIN_FEE_DEBIT: 'Comisión de Administración de Préstamo',
  LATE_PAYMENT_FEE_DEBIT: 'Comisión por Pago Tardío',
  PAYMENT_REVERSAL_DEBIT: 'Reversión de Pago',
  CREDIT_ADMIN_FEE_DEBIT: 'Comisión de Administración de Crédito',
  DIVIDEND_CREDIT: 'Excedentes',
  FEE_REIMBURSEMENT_CREDIT: 'Reintegro de Comisión',
  ADJUSTMENT_CREDIT: 'Ajuste (Crédito)',
  ADJUSTMENT_DEBIT: 'Ajuste (Débito)',
  FEE_CORRECTION_DEBIT: 'Corrección de Comisión',
  ADMIN_FEE_DEBIT: 'Comisión de Administración',
  OTHER_DEBIT: 'Otro (Débito)',
  FEE_DEBIT: 'Comisión',
  OTHER_CREDIT: 'Otro (Crédito)',
  LIQUIDATION_BALANCE: 'Liquidación de Haberes',
  LOAN_DISBURSEMENT_REVERSAL_DEBIT: 'Reversión de Desembolso de Préstamo',
  SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Préstamo Especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Crédito Comercial',
  SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT:
    'Reversión de Desembolso de Crédito Especial',
  LOAN_PAYMENT_REVERSAL_CREDIT: 'Reversión de Pago de Préstamo',
  COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT:
    'Reversión de Pago de Crédito Comercial',
  SAVING_WITHDRAWAL_REVERSAL_CREDIT: 'Reversión de Retiro de Ahorro',
  LIQUIDATION_BALANCE_REVERSAL_CREDIT: 'Reversión de Liquidación de Haberes',
  ACCOUNTING_ADJUSTMENT_DEBIT: 'Ajuste Contable (Débito)',
  ACCOUNTING_ADJUSTMENT_CREDIT: 'Ajuste Contable (Crédito)',
  LIQUIDATION_LOAN_PAYMENT_DEBIT: 'Pago de préstamo durante liquidación',
  LIQUIDATION_CREDIT_PAYMENT_DEBIT: 'Pago de crédito durante liquidación',
  LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT:
    'Pago de crédito comercial durante liquidación',
  LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT:
    'Pago de préstamo especial durante liquidación',
  LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT:
    'Pago de crédito especial durante liquidación',
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
  PROCESSED: 'Procesado',
} as const;

export const MOVEMENT_STATUS_TYPES = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
} as const;
