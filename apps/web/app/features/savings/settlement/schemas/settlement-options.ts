export const SETTLEMENT_TYPE_LABELS = {
  COMPLETE: 'Completa',
  SPECIAL: 'Especial',
} as const;

export type SettlementType = keyof typeof SETTLEMENT_TYPE_LABELS;

export const ESTATUS_TYPES = {
  REQUESTED: 'Solicitado',
  PROCESSED: 'Aprobado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente desembolso banco',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso revertido',
  ADJUSTED: 'Ajuste',
} as const;

export type StatusType = keyof typeof ESTATUS_TYPES;
