export const ACCOUNT_PAYABLE_STATUS_TYPES = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  IN_PROGRESS: 'Parcialmente Pagada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
} as const;

export type AccountPayableStatusType =
  keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES;

export enum AccountPayableStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export const TRANSACTION_TYPES = {
  PAYMENT: 'Pago',
  REVERSED: 'Reversado',
  DEBIT_NOTE: 'Nota de Débito',
  CREDIT_NOTE: 'Nota de Crédito',
  ADVANCE: 'Anticipo',
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPES;
