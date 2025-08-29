export const SUPPLIER_INVOICE_STATUS_TYPES = {
  DRAFT: 'BORRADOR',
  PENDING: 'PENDIENTE',
  ACCOUNTED_FOR: 'CONTABILIZADA',
  PAID: 'PAGADA',
  CANCELLED: 'ANULADA',
} as const;

export type SupplierInvoiceStatusType =
  keyof typeof SUPPLIER_INVOICE_STATUS_TYPES;

export enum SupplierInvoiceStatusEnum {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACCOUNTED_FOR = 'ACCOUNTED_FOR',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export const SUPPLIER_INVOICE_PAYMENT_TYPES = {
  CASH: 'CONTADO',
  CREDIT: 'CRÉDITO',
} as const;

export type SupplierInvoicePaymentType =
  keyof typeof SUPPLIER_INVOICE_PAYMENT_TYPES;

export enum SupplierInvoicePaymentTypeEnum {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

export enum purchaseItemTypeEnum {
  SALES_INVENTORY = 'SALES_INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  SERVICE = 'SERVICE',
  EXPENSE = 'EXPENSE',
  SERVICE_EXPENSE = 'SERVICE_EXPENSE',
}

export const PURCHASE_ITEM_TYPES = {
  [purchaseItemTypeEnum.SALES_INVENTORY]: 'Inventario de Venta',
  [purchaseItemTypeEnum.FIXED_ASSET]: 'Activo Fijo',
  [purchaseItemTypeEnum.SERVICE]: 'Servicio',
  [purchaseItemTypeEnum.EXPENSE]: 'Gasto',
  [purchaseItemTypeEnum.SERVICE_EXPENSE]: 'Servicio/Gasto',
};

export type PurchaseItemType = keyof typeof PURCHASE_ITEM_TYPES;

export const CURRENCY_CODES = {
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
  VES: 'Bolívar Soberano',
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CODES;

export const PAYMENT_METHOD = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  DEPOSIT: 'DEPÓSITO',
  MOBILE_PAYMENT: 'PAGO_MÓVIL',
  OTHER: 'OTRO',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DEPOSIT = 'DEPOSIT',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTRO',
}
