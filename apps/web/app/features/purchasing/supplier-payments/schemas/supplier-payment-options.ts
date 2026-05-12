export const PAYMENT_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  REVERSED: 'REVERSED',
  CANCELLED: 'CANCELLED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: 'Completado',
  PENDING: 'Pendiente',
  REVERSED: 'Reversado',
  CANCELLED: 'Anulado',
};

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  CHECK: 'CHECK',
  DEPOSIT: 'DEPOSIT',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro',
};

export const CURRENCY_CODE_OPTIONS = {
  VES: 'VES',
  USD: 'USD',
} as const;

export type CurrencyCodeOption = (typeof CURRENCY_CODE_OPTIONS)[keyof typeof CURRENCY_CODE_OPTIONS];

export const CURRENCY_CODE_LABELS: Record<CurrencyCodeOption, string> = {
  VES: 'Bolívares (VES)',
  USD: 'Dólares (USD)',
};
