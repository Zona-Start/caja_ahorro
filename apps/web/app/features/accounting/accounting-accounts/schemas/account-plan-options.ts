export const ACCOUNT_TYPES = {
  ASSET: 'ACTIVO',
  LIABILITY: 'PASIVO',
  EQUITY: 'PATRIMONIO',
  REVENUE: 'INGRESOS',
  EXPENSE: 'GASTOS',
  MEMORANDUM: 'MEMORANDUM',
} as const;

export const ACCOUNT_LEVELS = {
  1: 'Nivel 1 - Cuenta Principal',
  2: 'Nivel 2 - Subcuenta',
  3: 'Nivel 3 - Cuenta Detallada',
  4: 'Nivel 4 - Cuenta Auxiliar',
} as const;

export const NATURE_TYPE = {
  DEBIT: 'DEBITO',
  CREDIT: 'CREDITO',
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPES;
export type AccountLevel = keyof typeof ACCOUNT_LEVELS;
export type NATURE = keyof typeof NATURE_TYPE;
