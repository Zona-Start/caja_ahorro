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
  CREDIT: 'CREDIT',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CASH: 'De Contado',
  CREDIT: 'A Crédito',
};

export const PAYMENT_METHOD = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
  CHECK: 'CHECK',
  DEPOSIT: 'DEPOSIT',
  MOBILE_PAYMENT: 'MOBILE_PAYMENT',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
};

export const LINE_TYPE = {
  SALES_INVENTORY: 'SALES_INVENTORY',
  SERVICE: 'SERVICE',
  EXPENSE: 'EXPENSE',
} as const;

export type LineType = (typeof LINE_TYPE)[keyof typeof LINE_TYPE];

export const LINE_TYPE_LABELS: Record<LineType, string> = {
  SALES_INVENTORY: 'Producto',
  SERVICE: 'Servicio',
  EXPENSE: 'Gasto',
};
