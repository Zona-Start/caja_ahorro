export const ACCOUNT_TYPES = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  patrimonio: 'Patrimonio',
  ingreso: 'Ingreso',
  gasto: 'Gasto',
  costo: 'Costo',
  cuenta_orden: 'Cuenta de Orden',
} as const;

export const ACCOUNT_LEVELS = {
  1: 'Nivel 1 - Cuenta Principal',
  2: 'Nivel 2 - Subcuenta',
  3: 'Nivel 3 - Cuenta Detallada',
  4: 'Nivel 4 - Cuenta Auxiliar',
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPES;
export type AccountLevel = keyof typeof ACCOUNT_LEVELS;