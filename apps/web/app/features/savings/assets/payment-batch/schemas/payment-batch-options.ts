export const PAYMENT_BATCH_STATUS = {
  DRAFT: 'Borrador',
  UPLOADED: 'Subido',
  PROCESSED: 'Procesado',
  CANCELLED: 'Cancelado',
} as const;

export const PAYMENT_BATCH_ITEM_TYPE = {
  LOAN: 'Préstamo',
  WITHDRAWAL: 'Retiro',
  LIQUIDATION: 'Liquidación',
} as const;

export const BATCH_TYPE = {
  PAYMENT: 'Pago',
  LOAN_DISBURSEMENT: 'Desembolso Préstamo',
} as const;

export type PaymentBatchStatus = keyof typeof PAYMENT_BATCH_STATUS;
export type PaymentBatchItemType = keyof typeof PAYMENT_BATCH_ITEM_TYPE;

export const paymentBatchStatusOptions = Object.entries(PAYMENT_BATCH_STATUS).map(
  ([value, label]) => ({ value, label }),
);
export const paymentBatchItemTypeOptions = Object.entries(PAYMENT_BATCH_ITEM_TYPE).map(
  ([value, label]) => ({ value, label }),
);
