export const ESTATUS_TYPES = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Supendido',
  RETIRED: 'Retirado',
} as const;

export const PAYROLL_TYPE = {
  true: 'SI',
  false: 'No',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PayrollType = keyof typeof PAYROLL_TYPE;
