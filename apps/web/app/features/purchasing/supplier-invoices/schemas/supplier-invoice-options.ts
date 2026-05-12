export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

export const PAYMENT_TYPE = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  CREDIT: 'CREDIT',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CREDIT: 'Crédito',
};

export const LINE_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
  EXPENSE: 'EXPENSE',
  OTHER: 'OTHER',
} as const;

export type LineType = (typeof LINE_TYPE)[keyof typeof LINE_TYPE];

export const LINE_TYPE_LABELS: Record<LineType, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  EXPENSE: 'Gasto',
  OTHER: 'Otro',
};
