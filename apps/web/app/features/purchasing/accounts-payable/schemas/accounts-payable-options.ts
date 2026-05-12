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

export const PRIORITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const PRIORITY_OPTIONS = {
  [PRIORITY.HIGH]: 'Alta',
  [PRIORITY.MEDIUM]: 'Media',
  [PRIORITY.LOW]: 'Baja',
} as const;
