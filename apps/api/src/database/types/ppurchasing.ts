import {
  accountsPayable,
  purchaseOrderItems,
  purchaseOrders,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoiceItems,
  supplierInvoices,
  supplierPaymentLines,
  supplierPayments,
  supplierTransactionApplications,
  supplierTransactions,
  suppliers,
} from '../schema/tables/purchasing';

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type NewAccountPayable = typeof accountsPayable.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type SupplierAdvance = typeof supplierAdvances.$inferSelect;
export type NewSupplierAdvance = typeof supplierAdvances.$inferInsert;

export type SupplierCreditNote = typeof supplierCreditNotes.$inferSelect;
export type NewSupplierCreditNote = typeof supplierCreditNotes.$inferInsert;

export type SupplierDebitNote = typeof supplierDebitNotes.$inferSelect;
export type NewSupplierDebitNote = typeof supplierDebitNotes.$inferInsert;

export type SupplierInvoiceItem = typeof supplierInvoiceItems.$inferSelect;
export type NewSupplierInvoiceItem = typeof supplierInvoiceItems.$inferInsert;

export type SupplierInvoice = typeof supplierInvoices.$inferSelect;
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert;

export type SupplierPaymentLine = typeof supplierPaymentLines.$inferSelect;
export type NewSupplierPaymentLine = typeof supplierPaymentLines.$inferInsert;

export type SupplierPayment = typeof supplierPayments.$inferSelect;
export type NewSupplierPayment = typeof supplierPayments.$inferInsert;

export type SupplierTransactionApplication =
  typeof supplierTransactionApplications.$inferSelect;
export type NewSupplierTransactionApplication =
  typeof supplierTransactionApplications.$inferInsert;

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type NewSupplierTransaction = typeof supplierTransactions.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
