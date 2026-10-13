/**
 * Etiquetas en español para los códigos del ERP.
 * Fuente: diccionarios del backend (savings). `label()` cae al código original
 * si no encuentra traducción.
 */

export const MOVEMENT_TYPES: Record<string, string> = {
  SAVING_CONTRIBUTION: 'Aporte del Asociado',
  EMPLOYER_CONTRIBUTION: 'Aporte del Empleador',
  SURPLUS_SAVINGS_CONTRIBUTION: 'Aporte por Excedentes',
  VOLUNTARY_SAVINGS: 'Aporte Voluntario',
  SAVING_WITHDRAWAL: 'Retiro de Ahorro',
  LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo',
  SPECIAL_LOAN_DISBURSEMENT_CREDIT: 'Desembolso de Préstamo Especial',
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Comercial',
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT: 'Desembolso de Crédito Especial',
  LOAN_REFINANCING_DEBIT: 'Refinanciamiento de Préstamo (Débito)',
  LOAN_REFINANCING_CREDIT: 'Refinanciamiento de Préstamo (Crédito)',
  LOAN_PAYMENT_DEBIT: 'Pago de Préstamo',
  COMMERCIAL_CREDIT_PAYMENT_DEBIT: 'Pago de Crédito Comercial',
  LOAN_REIMBURSEMENT_CREDIT: 'Reintegro de Préstamo',
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT: 'Reintegro de Crédito Comercial',
  LOAN_OVERPAYMENT_CREDIT: 'Pago de más de Préstamo',
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
  CREDIT_PAYMENT_REVERSAL_CREDIT: 'Reversión de Pago de Crédito',
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
};

export const MOVEMENT_STATUS_TYPES: Record<string, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
};

export const LOAN_STATUS_TYPES: Record<string, string> = {
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
};

export const CREDIT_STATUS_TYPES: Record<string, string> = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
};

export const WITHDRAWAL_STATUS_TYPES: Record<string, string> = {
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
};

export const PAYMENT_LOAN_STATUS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELED: 'Cancelado',
};

export const PAYMENT_METHOD_TYPES: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro',
  MOBILE_PAYMENT: 'Pago Móvil',
};

export const ASSOCIATE_STATUS_TYPES: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  LOCKED: 'Bloqueado',
  RETIRED: 'Retirado',
  ARCHIVED: 'Archivado',
};

/** Traduce un código a su etiqueta; si no existe, devuelve el código. */
export function label(map: Record<string, string>, value: unknown): string {
  if (value == null || value === '') return '—';
  const key = String(value);
  return map[key] ?? key;
}

/** Tipo de plazo / periodicidad (valores en inglés del ERP → español). */
export const TERM_TYPES: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  FORTNIGHTLY: 'Quincenal',
  SEMIMONTHLY: 'Quincenal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  SEMIANNUALLY: 'Semestral',
  ANNUAL: 'Anual',
  YEARLY: 'Anual',
  CUOTAS: 'Cuotas',
  PLAZO: 'Plazo',
};

const TONE_SUCCESS = new Set([
  'PAID',
  'COMPLETED',
  'ACTIVE',
  'DISBURSED',
  'PROCESSED',
]);
const TONE_INFO = new Set(['APPROVED', 'IN_PAYMENT']);
const TONE_WARNING = new Set([
  'PENDING',
  'REQUESTED',
  'PENDING_DISBURSEMENT_BANK_BATCH',
  'PARTIAL',
]);
const TONE_DANGER = new Set([
  'REJECTED',
  'OVERDUE',
  'CANCELLED',
  'CANCELED',
  'DISBURSEMENT_FAILED',
  'REVERSED',
  'DISBURSED_REVERSED',
]);

/** Devuelve la clase de tono del badge según el estado (para claro/oscuro). */
export function statusTone(value: unknown): string {
  const key = String(value ?? '');
  if (TONE_SUCCESS.has(key)) return 'badge--success';
  if (TONE_INFO.has(key)) return 'badge--info';
  if (TONE_WARNING.has(key)) return 'badge--warning';
  if (TONE_DANGER.has(key)) return 'badge--danger';
  return 'badge--muted';
}
