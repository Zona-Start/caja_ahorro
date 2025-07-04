export const ESTATUS_TYPES = {
  ACTIVE: 'ACTIVO', // Asociado activo, puede realizar operaciones
  INACTIVE: 'INACTIVO', // Asociado inactivo temporalmente
  PENDING: 'PENDIENTE', // Asociado en proceso de registro/aprobación
  SUSPENDED: 'SUSPENDIDO', // Asociado suspendido (ej. por mora grave)
  LOCKED: 'BLOQUEADO', // Cuenta bloqueada
  RETIRED: 'RETIRADO', // Asociado retirado y liqudiado (ya no es miembro, pero su historial se mantiene)
  ARCHIVED: 'ARCHIVADO', // Nuevo: Para asociados o registros antiguos que se mantienen por historia pero no son activos ni liquidados
} as const;

export const PAYROLL_TYPE = {
  true: 'SI',
  false: 'No',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PayrollType = keyof typeof PAYROLL_TYPE;
