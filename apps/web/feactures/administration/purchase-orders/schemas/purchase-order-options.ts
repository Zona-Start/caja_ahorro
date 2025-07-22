export const ESTATUS_TYPES = {
  DRAFT: 'BORRADOR',
  PENDING: 'PENDIENTE',
  PARTIALLY_PAID: 'PARCIALMENTE PAGADA',
  PAID: 'PAGADA',
  CANCELLED: 'CANCELADA',
  OVERDUE: 'VENCIDA',
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;

export const INVOICE_CATEGORY_TYPES = {
  GOODS: 'Bienes',
  SERVICES: 'Servicios',
  EXPENSES: 'Gastos',
  OTHERS: 'Otros',
} as const;

export type InvoiceCategoryType = keyof typeof INVOICE_CATEGORY_TYPES;

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

export enum PurchaseTypeEnum {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

export const PURCHASE_TYPES = {
  CASH: 'Contado',
  CREDIT: 'Crédito',
} as const;

export type PurchaseType = keyof typeof PURCHASE_TYPES;
