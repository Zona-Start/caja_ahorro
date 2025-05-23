export const ESTATUS_TYPES = {
  REQUESTED: 'SOLICITADO',
  APPROVED: 'APROBADO',
  REJECTED: 'RECHAZADO',
  DISBURSED: 'DESEMBOLSADO',
  IN_PAYMENT: 'EN_PAGO',
  PAID: 'PAGADO',
  CANCELLED: 'CANCELADO',
  OVERDUE: 'VENCIDO',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  DEPOSIT: 'DEPÓSITO',
  MOBILE_PAYMENT: 'PAGO_MÓVIL',
  OTHER: 'OTRO',
} as const;

export const lOAN_MODALITY = {
  ORDINARY: 'ORDINARIO',
  SPECIAL_QUOTAS: 'CUOTAS ESPECIALES',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type LoanModality = keyof typeof lOAN_MODALITY;
