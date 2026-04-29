export const LOAN_DISBURSEMENT_BATCH_STATUS = {
  DRAFT: 'Pendiente',
  UPLOADED: 'En Proceso',
  PROCESSED: 'Procesado',
  CANCELLED: 'Cancelado',
} as const;

export const LOAN_DISBURSEMENT_BATCH_ITEM_TYPE = {
  LOAN: 'Prestamo',
  WITHDRAWAL: 'Retiro',
  LIQUIDATION: 'Liquidación',
} as const;

export const CURRENCY_CODE_ENUM = {
  VES: 'VES',
  USD: 'USD',
} as const;

export type LoanDisbursementBatchStatus = keyof typeof LOAN_DISBURSEMENT_BATCH_STATUS;
export type LoanDisbursementBatchItemType = keyof typeof LOAN_DISBURSEMENT_BATCH_ITEM_TYPE;
export type CurrencyCodeEnum = keyof typeof CURRENCY_CODE_ENUM;

export const loanDisbursementBatchStatusEnum = Object.values(LOAN_DISBURSEMENT_BATCH_STATUS) as [
  string,
  ...string[],
];

export const loanDisbursementBatchItemTypeEnum = Object.values(
  LOAN_DISBURSEMENT_BATCH_ITEM_TYPE,
) as [string, ...string[]];
export const currencyCodeEnum = Object.values(CURRENCY_CODE_ENUM) as [
  string,
  ...string[],
];
