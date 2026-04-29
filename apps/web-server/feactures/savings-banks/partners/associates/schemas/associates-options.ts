export const ESTATUS_TYPES = {
  ACTIVE: 'Activo', // Asociado activo, puede realizar operaciones
  INACTIVE: 'Inactivo', // Asociado inactivo temporalmente
  PENDING: 'Pendiente', // Asociado en proceso de registro/aprobación
  SUSPENDED: 'Suspendido', // Asociado suspendido (ej. por mora grave)
  LOCKED: 'Bloqueado', // Cuenta bloqueada
  RETIRED: 'Retirado', // Asociado retirado y liqudiado (ya no es miembro, pero su historial se mantiene)
  ARCHIVED: 'Archivado', // Nuevo: Para asociados o registros antiguos que se mantienen por historia pero no son activos ni liquidados
} as const;

export const PAYROLL_TYPE = {
  true: 'SI',
  false: 'No',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type PayrollType = keyof typeof PAYROLL_TYPE;
