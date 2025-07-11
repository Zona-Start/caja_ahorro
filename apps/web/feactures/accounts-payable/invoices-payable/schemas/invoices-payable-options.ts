export const ESTATUS_TYPES = {
  DRAFT: 'BORRADOR',
  PENDING: 'PENDIENTE',
  PARTIALLY_PAID: 'PARCIALMENTE PAGADA',
  PAID: 'PAGADA',
  CANCELLED: 'CANCELLADO',
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
