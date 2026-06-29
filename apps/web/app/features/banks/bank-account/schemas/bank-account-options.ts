import { z } from 'zod';

export enum ACCOUNT_TYPE {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT = 'CREDIT',
}

export const ACCOUNT_TYPE_OPTIONS = {
  [ACCOUNT_TYPE.CHECKING]: 'Corriente',
  [ACCOUNT_TYPE.SAVINGS]: 'Ahorros',
  [ACCOUNT_TYPE.CREDIT]: 'Crédito',
} as const;

export enum CURRENCY_CODE {
  VES = 'VES',
  USD = 'USD',
  EUR = 'EUR',
}

export const CURRENCY_CODE_OPTIONS = {
  [CURRENCY_CODE.VES]: 'Bolívares (VES)',
  [CURRENCY_CODE.USD]: 'Dólares (USD)',
  [CURRENCY_CODE.EUR]: 'Euros (EUR)',
} as const;

export const STATUS_TYPES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export const STATUS_OPTIONS = {
  [STATUS_TYPES.ACTIVE]: 'Activo',
  [STATUS_TYPES.INACTIVE]: 'Inactivo',
} as const;
