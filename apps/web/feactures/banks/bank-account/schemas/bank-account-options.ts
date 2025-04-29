export const ESTATUS_TYPES = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
} as const;

export const CURRENCY_TYPE = {
  VES: 'VES',
  USD: 'USD',
} as const;

export const ACCOUNT_TYPES = {
  CURRENT: 'CORRIENTE',
  SAVING: 'AHORRO',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type CurrencyType = keyof typeof CURRENCY_TYPE;
export type AccountType = keyof typeof ACCOUNT_TYPES;
