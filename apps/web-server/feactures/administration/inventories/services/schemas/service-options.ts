export const SERVICE_STATUS_TYPES = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
} as const;

export type ServiceStatusType = keyof typeof SERVICE_STATUS_TYPES;
