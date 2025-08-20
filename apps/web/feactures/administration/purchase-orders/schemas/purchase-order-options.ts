export const ESTATUS_TYPES = {
  PENDING: 'PENDIENTE',
  RECEIVED: 'RECIBIDA',
  CANCELLED: 'CANCELADA',
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
  SALES_INVENTORY: 'Producto',
  FIXED_ASSET: 'Activo Fijo',
  SERVICE: 'Servicio',
  EXPENSE: 'Gasto',
  MANUAL: 'Manual',
} as const;

export const PURCHASE_ITEM_TYPE_OPTIONS = Object.entries(
  PURCHASE_ITEM_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export enum PurchaseTypeEnum {
  SALES_INVENTORY = 'SALES_INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  SERVICE = 'SERVICE',
  EXPENSE = 'EXPENSE',
  MANUAL = 'MANUAL',
}

export type PurchaseType = keyof typeof PurchaseTypeEnum;
