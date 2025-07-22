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
} as const;

export enum purchaseItemTypeEnum {
  SALES_INVENTORY = 'SALES_INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  EXPENSE = 'EXPENSE',
}

export type PurchaseItemType = keyof typeof PURCHASE_ITEM_TYPES;
