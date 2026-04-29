import { relations } from 'drizzle-orm';
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
} from '../tables/purchasing';
import { accountPlan } from '../tables/accounting';
import { states } from '../tables/core';
import { tenants } from '../tables/tenants';
import { bankAccounts } from '../tables/treasury';
import { fixedAssetsPrices, productPrices, servicePrices, productServiceSuppliers, inventoryMovements } from '../tables/inventory';

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenants: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
  state: one(states, {
    fields: [suppliers.state],
    references: [states.id],
  }),

  purchaseOrders: many(purchaseOrders),
  invoices: many(supplierInvoices),
  accountsPayable: many(accountsPayable),
  advances: many(supplierAdvances),
  creditNotes: many(supplierCreditNotes),
  debitNotes: many(supplierDebitNotes),
  payments: many(supplierPayments),
  transactions: many(supplierTransactions),

  productPrices: many(productPrices),
  servicePrices: many(servicePrices),
  fixedAssetsPrices: many(fixedAssetsPrices),
  productLinks: many(productServiceSuppliers),
}));

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [purchaseOrders.supplierId],
      references: [suppliers.id],
    }),
    items: many(purchaseOrderItems),
    invoices: many(supplierInvoices),
  }),
);

export const purchaseOrderItemsRelations = relations(
  purchaseOrderItems,
  ({ one }) => ({
    order: one(purchaseOrders, {
      fields: [purchaseOrderItems.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
  }),
);

export const supplierInvoicesRelations = relations(
  supplierInvoices,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierInvoices.supplierId],
      references: [suppliers.id],
    }),
    purchaseOrder: one(purchaseOrders, {
      fields: [supplierInvoices.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
    tenants: one(tenants, {
      fields: [supplierInvoices.tenantId],
      references: [tenants.id],
    }),
    items: many(supplierInvoiceItems),
    accountsPayable: one(accountsPayable),
    inventoryMovements: many(inventoryMovements),
  }),
);

export const supplierInvoiceItemsRelations = relations(
  supplierInvoiceItems,
  ({ one }) => ({
    invoice: one(supplierInvoices, {
      fields: [supplierInvoiceItems.invoiceId],
      references: [supplierInvoices.id],
    }),
    expenseAccount: one(accountPlan, {
      fields: [supplierInvoiceItems.expenseAccountId],
      references: [accountPlan.id],
    }),
  }),
);

export const accountsPayableRelations = relations(
  accountsPayable,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [accountsPayable.tenantId],
      references: [tenants.id],
    }),
    supplier: one(suppliers, {
      fields: [accountsPayable.supplierId],
      references: [suppliers.id],
    }),
    supplierInvoice: one(supplierInvoices, {
      fields: [accountsPayable.supplierInvoiceId],
      references: [supplierInvoices.id],
    }),
    paymentLines: many(supplierPaymentLines),
    creditNotes: many(supplierCreditNotes),
    debitNotes: many(supplierDebitNotes),
    transactionApplications: many(supplierTransactionApplications),
  }),
);

export const supplierAdvancesRelations = relations(
  supplierAdvances,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierAdvances.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierAdvances.transactionId],
      references: [supplierTransactions.id],
    }),
  }),
);

export const supplierCreditNotesRelations = relations(
  supplierCreditNotes,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierCreditNotes.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierCreditNotes.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierCreditNotes.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

export const supplierDebitNotesRelations = relations(
  supplierDebitNotes,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierDebitNotes.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierDebitNotes.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierDebitNotes.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

export const supplierPaymentsRelations = relations(
  supplierPayments,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierPayments.supplierId],
      references: [suppliers.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [supplierPayments.bankAccountId],
      references: [bankAccounts.id],
    }),
    lines: many(supplierPaymentLines),
  }),
);

export const supplierPaymentLinesRelations = relations(
  supplierPaymentLines,
  ({ one }) => ({
    payment: one(supplierPayments, {
      fields: [supplierPaymentLines.supplierPaymentId],
      references: [supplierPayments.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierPaymentLines.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

export const supplierTransactionsRelations = relations(
  supplierTransactions,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [supplierTransactions.tenantId],
      references: [tenants.id],
    }),
    supplier: one(suppliers, {
      fields: [supplierTransactions.supplierId],
      references: [suppliers.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [supplierTransactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    advances: many(supplierAdvances),
    creditNotes: many(supplierCreditNotes),
    debitNotes: many(supplierDebitNotes),
    applications: many(supplierTransactionApplications),
  }),
);

export const supplierTransactionApplicationsRelations = relations(
  supplierTransactionApplications,
  ({ one }) => ({
    transaction: one(supplierTransactions, {
      fields: [supplierTransactionApplications.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierTransactionApplications.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);
