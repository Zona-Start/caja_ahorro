export const RECONCILIATION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
} as const;

export type ReconciliationStatus =
  (typeof RECONCILIATION_STATUS)[keyof typeof RECONCILIATION_STATUS];

export const RECONCILIATION_STATUS_OPTIONS = {
  [RECONCILIATION_STATUS.IN_PROGRESS]: 'En Progreso',
  [RECONCILIATION_STATUS.COMPLETED]: 'Completada',
  [RECONCILIATION_STATUS.PENDING]: 'Pendiente',
  [RECONCILIATION_STATUS.REVIEWED]: 'Revisada',
} as const;

export const RECONCILIATION_ITEM_STATUS_OPTIONS = {
  PENDING: 'Pendiente',
  RECONCILED: 'Conciliado',
  MANUAL_MATCH: 'Emparejado Manual',
  ADJUSTMENT: 'Ajuste',
  EXCLUDED: 'Excluido',
  NON_EXISTENT_IN_BANK: 'No existe en banco',
  VOIDED: 'Anulado',
} as const;

export const CATEGORY_OPTIONS = {
  MEMBER_CONTRIBUTION: 'Aporte Socio',
  MEMBER_WITHDRAWAL: 'Retiro Socio',
  PAYROLL_SETTLEMENT: 'Liquidación',
  LOAN_DISBURSEMENT: 'Desembolso Préstamo',
  LOAN_PAYMENT: 'Pago Préstamo',
  CREDIT_DISBURSEMENT: 'Desembolso Crédito',
  CREDIT_PAYMENT: 'Pago Crédito',
  BATCH_DISBURSEMENT: 'Desembolso por Lote',
  SUPPLIER_PAYMENT: 'Pago a Proveedor',
  SUPPLIER_ADVANCE_PAYMENT: 'Anticipo a Proveedor',
  INTERNAL_TRANSFER: 'Transferencia Interna',
  BANK_FEE: 'Comisión Bancaria',
  INTEREST_EARNED: 'Intereses Ganados',
  INTEREST_CHARGED: 'Intereses Cobrados',
  BANK_ADJUSTMENT: 'Ajuste Bancario',
  TAX_DEBIT: 'Débito Fiscal',
  TAX_CREDIT: 'Crédito Fiscal',
  OTHER_INCOME: 'Otro Ingreso',
  OTHER_EXPENSE: 'Otro Gasto',
  OPENING_BANK: 'Apertura Bancaria',
  CLOSING_BANK: 'Cierre Bancario',
} as const;

export const PAYMENT_METHOD_OPTIONS = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
} as const;

export const MOVEMENT_TYPE_OPTIONS = {
  CREDIT: 'Crédito (Entrada)',
  DEBIT: 'Débito (Salida)',
} as const;
