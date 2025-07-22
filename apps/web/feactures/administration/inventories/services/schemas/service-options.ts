export const SERVICE_STATUS_TYPES = {
  ACTIVE: 'ACTIVO',
  INACTIVE: 'INACTIVO',
} as const;

export type ServiceStatusType = keyof typeof SERVICE_STATUS_TYPES;
