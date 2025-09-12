export const SUPPLIER_PAYMENT_STATUS_TYPES = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  SENT_TO_BANK: 'Enviado',
  PROCESSED: 'Procesado',
  CANCELLED: 'Anulado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
} as const;

export type SupplierPaymentStatusType =
  keyof typeof SUPPLIER_PAYMENT_STATUS_TYPES;

export enum SupplierPaymentStatusEnum {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT_TO_BANK = 'SENT_TO_BANK',
  PROCESSED = 'PROCESSED',
  CANCELLED = 'ANULADO',
  REJECTED = 'REJECTED',
  REVERSED = 'REVERSADO',
}

export const PAYMENT_METHOD_TYPES = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'otro',
} as const;

export type PaymentMethodType = keyof typeof PAYMENT_METHOD_TYPES;

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DEPOSIT = 'DEPOSIT',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTHER',
}
