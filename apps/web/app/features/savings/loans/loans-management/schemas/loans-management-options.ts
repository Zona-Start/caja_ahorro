export const ESTATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  DISBURSED: 'Desembolsado',
  IN_PAYMENT: 'En pago',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rechazado',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago móvil',
  OTHER: 'Otro',
} as const;

export const LOAN_MODALITY = {
  ORDINARY: 'Ordinario',
  SPECIAL_QUOTAS: 'Cuotas especiales',
} as const;

export const lOAN_MODALITY = LOAN_MODALITY;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type LoanModality = keyof typeof LOAN_MODALITY;
