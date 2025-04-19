export const ESTATUS_TYPES = {
  active: 'Activo',
  inactive: 'Inactivo',
} as const;

export const PAYROLL_TYPE = {
  true: 'SI',
  false: 'No',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PayrollType = keyof typeof PAYROLL_TYPE;
