export const ACCOUNT_PAYABLE_STATUS_TYPES = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  IN_PROGRESS: 'Parcialmente Pagada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  ADVANCE: 'Anticipo',
  ADVANCE_APPLIED: 'Anticipo Aplicado',
} as const;

export type AccountPayableStatusType =
  keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES;

export enum AccountPayableStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  ADVANCE = 'ADVANCE',
  ADVANCE_APPLIED = 'ADVANCE_APPLIED',
}

export const TRANSACTION_TYPES = {
  PAYMENT: 'Pago',
  REVERSED: 'Reversado',
  DEBIT_NOTE: 'Nota de Débito',
  DEBIT_NOTE_APPLIED: 'Nota de Débito Aplicado',
  CREDIT_NOTE: 'Nota de Crédito',
  CREDIT_NOTE_APPLIED: 'Nota de Crédito Aplicado',
  ADVANCE: 'Anticipo',
  ADVANCE_APPLIED: 'Anticipo Aplicado',
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPES;
