export const ACCOUNT_PAYABLE_STATUS_TYPES = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  IN_PROGRESS: 'Parcialmente Pagada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  ADVANCE: 'Anticipo',
  ADVANCE_APPLIED: 'Anticipo Aplicado',
} as const;

export type AccountPayableStatusType =
  keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES;

export enum AccountPayableStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  ADVANCE = 'ADVANCE',
  ADVANCE_APPLIED = 'ADVANCE_APPLIED',
}
