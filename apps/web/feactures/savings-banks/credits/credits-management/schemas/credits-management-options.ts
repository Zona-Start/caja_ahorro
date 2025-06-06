export const ESTATUS_TYPES = {
  REQUESTED: 'SOLICITADO',
  APPROVED: 'APROBADO',
  IN_PAYMENT: 'EN_PAGO',
  PAID: 'PAGADO',
} as const;

export const CREDIT_MODALITY = {
  ORDINARY: 'ORDINARIO',
  SPECIAL_QUOTAS: 'CUOTAS ESPECIALES',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type CreditModality = keyof typeof CREDIT_MODALITY;
