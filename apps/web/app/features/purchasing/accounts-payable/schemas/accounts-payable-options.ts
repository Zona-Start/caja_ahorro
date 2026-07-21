export const STATUS = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_OPTIONS = {
  [STATUS.PENDING]: 'Pendiente',
  [STATUS.AUTHORIZED]: 'Autorizado',
  [STATUS.PAID]: 'Pagado',
  [STATUS.CANCELLED]: 'Cancelado',
} as const;
