export const SUPPLIER_INVOICE_STATUS_TYPES = {
  OPEN: 'ABIERTA',
  PAID: 'PAGADA',
  PARTIALLY_PAID: 'PARCIALMENTE PAGADA',
  CANCELLED: 'CANCELADA',
  OVERDUE: 'VENCIDA',
} as const;

export type SupplierInvoiceStatusType = keyof typeof SUPPLIER_INVOICE_STATUS_TYPES;

export enum SupplierInvoiceStatusEnum {
  OPEN = 'OPEN',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export const SUPPLIER_INVOICE_PAYMENT_TYPES = {
  CASH: 'CONTADO',
  CREDIT: 'CRÉDITO',
} as const;

export type SupplierInvoicePaymentType = keyof typeof SUPPLIER_INVOICE_PAYMENT_TYPES;

export enum SupplierInvoicePaymentTypeEnum {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

export const PURCHASE_ITEM_TYPES = {
  SALES_INVENTORY: 'SALES_INVENTORY',
  FIXED_ASSET: 'FIXED_ASSET',
  EXPENSE: 'EXPENSE',
  SERVICE: 'SERVICE',
} as const;

export enum purchaseItemTypeEnum {
  SALES_INVENTORY = 'SALES_INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  EXPENSE = 'EXPENSE',
  SERVICE = 'SERVICE',
}

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
