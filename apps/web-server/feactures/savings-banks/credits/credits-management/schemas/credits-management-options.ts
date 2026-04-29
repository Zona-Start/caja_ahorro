export const ESTATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
} as const;

export const CREDIT_MODALITY = {
  ORDINARY: 'Ordinario',
  SPECIAL_QUOTAS: 'Cuotas Especiales',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type CreditModality = keyof typeof CREDIT_MODALITY;
