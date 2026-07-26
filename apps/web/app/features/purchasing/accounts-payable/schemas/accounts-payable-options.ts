export const STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_OPTIONS = {
  [STATUS.PENDING]: 'Pendiente',
  [STATUS.APPROVED]: 'Aprobada',
  [STATUS.PARTIALLY_PAID]: 'Pago Parcial',
  [STATUS.PAID]: 'Pagada',
  [STATUS.CANCELLED]: 'Cancelada',
} as const;
