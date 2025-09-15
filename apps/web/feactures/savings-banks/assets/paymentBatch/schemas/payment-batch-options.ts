import { z } from 'zod';

export const PAYMENT_BATCH_STATUS = {
  DRAFT: 'DRAFT',
  UPLOADED: 'UPLOADED',
  PROCESSED: 'PROCESSED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_BATCH_ITEM_TYPE = {
  LOAN: 'LOAN',
  WITHDRAWAL: 'WITHDRAWAL',
  LIQUIDATION: 'LIQUIDATION',
} as const;

export const CURRENCY_CODE_ENUM = {
  VES: 'VES',
  USD: 'USD',
} as const;

export type PaymentBatchStatus = keyof typeof PAYMENT_BATCH_STATUS;
export type PaymentBatchItemType = keyof typeof PAYMENT_BATCH_ITEM_TYPE;
export type CurrencyCodeEnum = keyof typeof CURRENCY_CODE_ENUM;

export const paymentBatchStatusEnum = z.enum(Object.values(PAYMENT_BATCH_STATUS));
export const paymentBatchItemTypeEnum = z.enum(Object.values(PAYMENT_BATCH_ITEM_TYPE));
export const currencyCodeEnum = z.enum(Object.values(CURRENCY_CODE_ENUM));
