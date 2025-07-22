export const SUPPLIER_TRANSACTION_TYPES = {
  PAYMENT: 'PAGO',
  CREDIT_NOTE: 'NOTA DE CRÉDITO',
  DEBIT_NOTE: 'NOTA DE DÉBITO',
  ADVANCE: 'ANTICIPO',
} as const;

export type SupplierTransactionType = keyof typeof SUPPLIER_TRANSACTION_TYPES;

export enum SupplierTransactionTypeEnum {
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  ADVANCE = 'ADVANCE',
}

export const PAYMENT_METHODS = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  OTHER: 'OTRO',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

export const SUPPLIER_TRANSACTION_STATUS_TYPES = {
  ACTIVE: 'ACTIVA',
  REVERSED: 'REVERTIDA',
} as const;

export type SupplierTransactionStatusType = keyof typeof SUPPLIER_TRANSACTION_STATUS_TYPES;

export enum SupplierTransactionStatusEnum {
  ACTIVE = 'ACTIVE',
  REVERSED = 'REVERSED',
}
