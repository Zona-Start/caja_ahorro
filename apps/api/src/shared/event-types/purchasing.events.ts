export const PURCHASING_EVENTS = {
  ORDER_CREATED: 'purchase.order.created',
  ORDER_STATUS_CHANGED: 'purchase.order.status.changed',
  ORDER_CANCELLED: 'purchase.order.cancelled',
  SUPPLIER_INVOICE_CREATED: 'supplier.invoice.created',
  SUPPLIER_INVOICE_ACCOUNTED: 'supplier.invoice.accounted',
  SUPPLIER_PAYMENT_CREATED: 'supplier.payment.created',
  SUPPLIER_PAYMENT_APPLIED: 'supplier.payment.applied',
  ACCOUNTS_PAYABLE_CREATED: 'accounts.payable.created',
  ACCOUNTS_PAYABLE_PAID: 'accounts.payable.paid',
  SUPPLIER_CREATED: 'supplier.created',
  SUPPLIER_STATUS_CHANGED: 'supplier.status.changed',
} as const;

export interface PurchaseOrderCreatedEvent {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  totalAmount: number;
  lineItems: Array<{ itemType: string; itemId: string; quantity: number; unitPrice: number }>;
  timestamp: string;
}

export interface PurchaseOrderStatusChangedEvent {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface PurchaseOrderCancelledEvent {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  timestamp: string;
}

export interface SupplierInvoiceCreatedEvent {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  totalAmount: number;
  timestamp: string;
}

export interface SupplierInvoiceAccountedEvent {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  totalAmount: number;
  accountedById: string;
  timestamp: string;
}

export interface SupplierPaymentCreatedEvent {
  tenantId: string;
  paymentId: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  bankAccountId?: string;
  timestamp: string;
}

export interface SupplierPaymentAppliedEvent {
  tenantId: string;
  paymentId: string;
  appliedToInvoices: Array<{ invoiceId: string; amount: number }>;
  timestamp: string;
}

export interface AccountsPayableCreatedEvent {
  tenantId: string;
  payableId: string;
  supplierId: string;
  invoiceId: string;
  totalAmount: number;
  dueDate: string;
  timestamp: string;
}

export interface AccountsPayablePaidEvent {
  tenantId: string;
  payableId: string;
  supplierId: string;
  paidAmount: number;
  remainingBalance: number;
  timestamp: string;
}

export interface SupplierCreatedEvent {
  tenantId: string;
  supplierId: string;
  businessName: string;
  taxId: string;
  timestamp: string;
}

export interface SupplierStatusChangedEvent {
  tenantId: string;
  supplierId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}
