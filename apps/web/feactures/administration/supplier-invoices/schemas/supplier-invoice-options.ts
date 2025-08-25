export const SUPPLIER_INVOICE_STATUS_TYPES = {
  OPEN: 'ABIERTA',
  PAID: 'PAGADA',
  VOID: 'ANULADA',
  PENDING_PAYMENT: 'PENDIENTE POR PAGAR',
} as const;

export type SupplierInvoiceStatusType =
  keyof typeof SUPPLIER_INVOICE_STATUS_TYPES;

export enum SupplierInvoiceStatusEnum {
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
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

export const INVOICE_TYPES = {
  EXPENSE: 'Gasto',
  PURCHASE: 'Compra',
} as const;

export enum InvoiceTypeEnum {
  EXPENSE = 'EXPENSE',
  PURCHASE = 'PURCHASE',
}

export type InvoiceType = keyof typeof INVOICE_TYPES;
