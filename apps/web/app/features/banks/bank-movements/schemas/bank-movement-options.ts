export const PAYMENT_METHOD = {
  TRANSFER: 'TRANSFER',
  CASH: 'CASH',
  CHECK: 'CHECK',
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_OPTIONS = {
  [PAYMENT_METHOD.TRANSFER]: 'Transferencia',
  [PAYMENT_METHOD.CASH]: 'Efectivo',
  [PAYMENT_METHOD.CHECK]: 'Cheque',
  [PAYMENT_METHOD.DEPOSIT]: 'Depósito',
  [PAYMENT_METHOD.WITHDRAWAL]: 'Retiro',
  [PAYMENT_METHOD.OTHER]: 'Otro',
} as const;

export const CATEGORY = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER: 'TRANSFER',
  PAYMENT: 'PAYMENT',
  FEE: 'FEE',
  INTEREST: 'INTEREST',
  ADJUSTMENT: 'ADJUSTMENT',
  OTHER: 'OTHER',
} as const;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

export const CATEGORY_OPTIONS = {
  [CATEGORY.DEPOSIT]: 'Depósito',
  [CATEGORY.WITHDRAWAL]: 'Retiro',
  [CATEGORY.TRANSFER]: 'Transferencia',
  [CATEGORY.PAYMENT]: 'Pago',
  [CATEGORY.FEE]: 'Comisión',
  [CATEGORY.INTEREST]: 'Interés',
  [CATEGORY.ADJUSTMENT]: 'Ajuste',
  [CATEGORY.OTHER]: 'Otro',
} as const;
