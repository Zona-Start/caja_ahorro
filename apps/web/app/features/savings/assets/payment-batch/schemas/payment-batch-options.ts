export const PAYMENT_BATCH_STATUS = {
  DRAFT: 'Pendiente',
  UPLOADED: 'En Proceso',
  PROCESSED: 'Procesado',
  CANCELLED: 'Cancelado',
} as const;

export const PAYMENT_BATCH_ITEM_TYPE = {
  LOAN: 'Prestamo',
  WITHDRAWAL: 'Retiro',
  LIQUIDATION: 'Liquidación',
} as const;

export const CURRENCY_CODE_ENUM = {
  VES: 'VES',
  USD: 'USD',
} as const;

export type PaymentBatchStatus = keyof typeof PAYMENT_BATCH_STATUS;
export type PaymentBatchItemType = keyof typeof PAYMENT_BATCH_ITEM_TYPE;
export type CurrencyCodeEnum = keyof typeof CURRENCY_CODE_ENUM;

export const paymentBatchStatusEnum = Object.values(PAYMENT_BATCH_STATUS) as [
  string,
  ...string[],
];

export const paymentBatchItemTypeEnum = Object.values(
  PAYMENT_BATCH_ITEM_TYPE,
) as [string, ...string[]];
export const currencyCodeEnum = Object.values(CURRENCY_CODE_ENUM) as [
  string,
  ...string[],
];